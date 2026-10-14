import uuid as uuid_pkg
from collections.abc import Mapping
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import BadRequestException, NotFoundException
from ..repositories.application_environment_repository import application_environment_repository
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient
from ..schemas.application_environment_client_secret import (
    ApplicationEnvironmentClientSecretCreateRequest,
    ApplicationEnvironmentClientSecretCredentialsRead,
    ApplicationEnvironmentClientSecretRotateRequest,
    ApplicationEnvironmentRotatedClientSecretRead,
)
from .audit_service import AuditService


class ApplicationEnvironmentClientSecretService:
    def __init__(self, audit_service: AuditService | None = None) -> None:
        self.audit_service = audit_service or AuditService()

    def _as_dict(self, value: Any) -> dict[str, Any]:
        if isinstance(value, Mapping):
            return dict(value)
        if hasattr(value, "model_dump"):
            dumped_value = value.model_dump(by_alias=True, exclude_none=True)
            if isinstance(dumped_value, dict):
                return dumped_value
        return {}

    def _first_string_value(self, value: Any, keys: tuple[str, ...]) -> str | None:
        value_dict = self._as_dict(value)
        for key in keys:
            candidate = value_dict.get(key)
            if candidate is not None and str(candidate).strip():
                return str(candidate).strip()
        return None

    def _normalize_epoch_seconds(self, value: Any) -> int | None:
        if value is None:
            return None
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None

    def _extract_client_secret(self, value: Any) -> str | None:
        value_dict = self._as_dict(value)
        secret = self._first_string_value(
            value_dict,
            ("clientSecret", "client_secret", "secret", "value"),
        )
        if secret is not None:
            return secret
        for key in ("clientSecrets", "client_secrets", "secrets", "rotatedSecrets"):
            entries = value_dict.get(key)
            if isinstance(entries, list):
                for entry in entries:
                    secret = self._first_string_value(
                        entry,
                        ("clientSecret", "client_secret", "secret", "value"),
                    )
                    if secret is not None:
                        return secret
        return None

    def _extract_client_secret_id(self, value: Any) -> str | None:
        value_dict = self._as_dict(value)
        secret_id = self._first_string_value(
            value_dict,
            ("clientSecretId", "client_secret_id", "secretId", "secret_id", "id"),
        )
        if secret_id is not None:
            return secret_id
        for key in ("clientSecrets", "client_secrets", "secrets", "rotatedSecrets"):
            entries = value_dict.get(key)
            if isinstance(entries, list):
                for entry in entries:
                    secret_id = self._first_string_value(
                        entry,
                        ("clientSecretId", "client_secret_id", "secretId", "secret_id", "id"),
                    )
                    if secret_id is not None:
                        return secret_id
        return None

    def _extract_rotated_secrets(self, value: Any) -> list[dict[str, Any]]:
        value_dict = self._as_dict(value)
        secret_entries: list[Any] = []
        for key in ("rotatedSecrets", "rotated_secrets"):
            entries = value_dict.get(key)
            if isinstance(entries, list):
                secret_entries.extend(entries)
        additional_config = self._as_dict(value_dict.get("additionalConfig"))
        for key in ("rotatedSecrets", "rotated_secrets"):
            entries = additional_config.get(key)
            if isinstance(entries, list):
                secret_entries.extend(entries)

        normalized_entries = []
        for index, entry in enumerate(secret_entries):
            entry_dict = self._as_dict(entry)
            secret_path = self._first_string_value(
                entry_dict,
                ("path", "secretId", "secret_id", "id"),
            ) or f"/rotatedSecrets/{index}"
            normalized_entries.append(
                ApplicationEnvironmentRotatedClientSecretRead.model_validate(
                    {
                        "description": self._first_string_value(entry_dict, ("description",)),
                        "expired_at": self._normalize_epoch_seconds(
                            entry_dict.get("expiredAt") or entry_dict.get("expired_at")
                        ),
                        "rotated_at": self._normalize_epoch_seconds(
                            entry_dict.get("rotatedAt") or entry_dict.get("rotated_at")
                        ),
                        "value": self._first_string_value(
                            entry_dict,
                            ("value", "secret", "clientSecret"),
                        ),
                        "secret_id": self._first_string_value(
                            entry_dict,
                            ("secretId", "secret_id", "id"),
                        ) or secret_path,
                    }
                ).model_dump(by_alias=True)
            )
        return normalized_entries

    async def _get_environment_context(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any]:
        environment = await application_environment_repository.get_client_secret_context(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )
        if environment is None:
            raise NotFoundException("Application environment not found")
        if not environment.get("ibm_client_id"):
            raise BadRequestException("Application environment has no IBM Verify client configured")
        return environment

    async def _audit_action(
        self,
        db: AsyncSession,
        current_user: dict[str, Any],
        environment: dict[str, Any],
        operation: str,
        description: str,
    ) -> None:
        await self.audit_service.log_action(
            db=db,
            user="user",
            user_uuid=current_user.get("uuid"),
            target="application_environment",
            target_uuid=environment["uuid"],
            operation=operation,
            description=description,
        )

    async def _read_credentials(
        self,
        ibm_admin_client: IBMVerifyAdminClient,
        client_id: str,
    ) -> dict[str, Any]:
        response = await ibm_admin_client.get_client_secret(client_id)
        secret = self._extract_client_secret(response)
        if secret is None:
            raise BadRequestException("IBM Verify response did not include a client secret")
        return ApplicationEnvironmentClientSecretCredentialsRead(
            client_id=client_id,
            client_secret=secret,
            client_secret_id=self._extract_client_secret_id(response),
        ).model_dump(by_alias=True)

    async def get_client_credentials(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> dict[str, Any]:
        environment = await self._get_environment_context(db, application_uuid, environment_uuid)
        credentials = await self._read_credentials(ibm_admin_client, environment["ibm_client_id"])
        await self._audit_action(
            db,
            current_user,
            environment,
            "REVEAL_SECRET",
            f"Revealed client credentials for application environment '{environment.get('partner_label', '')}'",
        )
        return credentials

    async def list_rotated_secrets(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        current_user: dict[str, Any],
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> list[dict[str, Any]]:
        environment = await self._get_environment_context(db, application_uuid, environment_uuid)
        response = await ibm_admin_client.get_client_secret(environment["ibm_client_id"])
        secrets = self._extract_rotated_secrets(response)
        await self._audit_action(
            db,
            current_user,
            environment,
            "VIEW_ROTATED",
            f"Viewed rotated client secrets for application environment '{environment.get('partner_label', '')}'",
        )
        return secrets

    async def rotate_secret(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        current_user: dict[str, Any],
        payload: ApplicationEnvironmentClientSecretRotateRequest,
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> dict[str, Any]:
        environment = await self._get_environment_context(db, application_uuid, environment_uuid)
        await ibm_admin_client.update_client_secret(
            environment["ibm_client_id"],
            payload.model_dump(by_alias=True),
        )
        operation = "REGENERATE" if not payload.description.strip() and payload.rotated_secret_expired_at == 0 else "ROTATE_SECRET"
        action = "Regenerated" if operation == "REGENERATE" else "Rotated"
        await self._audit_action(
            db,
            current_user,
            environment,
            operation,
            f"{action} client secret for application environment '{environment.get('partner_label', '')}'",
        )
        return await self._read_credentials(ibm_admin_client, environment["ibm_client_id"])

    async def create_rotated_secret(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        current_user: dict[str, Any],
        payload: ApplicationEnvironmentClientSecretCreateRequest,
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> list[dict[str, Any]]:
        environment = await self._get_environment_context(db, application_uuid, environment_uuid)
        await ibm_admin_client.update_client_secret(
            environment["ibm_client_id"],
            {
                "deleteRotatedSecrets": False,
                "description": payload.description,
                "rotatedSecretExpiredAt": payload.rotated_secret_expired_at,
            },
        )
        await self._audit_action(
            db,
            current_user,
            environment,
            "ROTATE_SECRET",
            f"Created rotated client secret for application environment '{environment.get('partner_label', '')}'",
        )
        response = await ibm_admin_client.get_client_secret(environment["ibm_client_id"])
        return self._extract_rotated_secrets(response)

    async def delete_rotated_secret(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        current_user: dict[str, Any],
        value: str,
        ibm_admin_client: IBMVerifyAdminClient,
    ) -> bool:
        environment = await self._get_environment_context(db, application_uuid, environment_uuid)
        client_id = environment["ibm_client_id"]
        response = await ibm_admin_client.get_client_secret(client_id)
        rotated_secrets = self._extract_rotated_secrets(response)
        if not any(secret.get("value") == value for secret in rotated_secrets):
            raise NotFoundException("Rotated client secret not found")
        deleted = await ibm_admin_client.delete_rotated_client_secrets(client_id, [value])
        if deleted:
            await self._audit_action(
                db,
                current_user,
                environment,
                "DELETE_ROTATED",
                f"Deleted rotated client secret for application environment '{environment.get('partner_label', '')}'",
            )
        return deleted
