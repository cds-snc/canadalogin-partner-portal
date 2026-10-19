import uuid as uuid_pkg
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import Any, Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.db.database import Base
from ..models.application import Application
from ..models.application_configuration import ApplicationConfiguration
from ..models.application_configuration_status import ApplicationConfigurationStatus
from ..models.tenant import Tenant


class ApplicationEnvironmentRepository:
    async def get_application_id(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
    ) -> int | None:
        statement = select(Application.id).where(
            Application.uuid == application_uuid,
            Application.is_deleted.is_(False),
        )
        return (await db.execute(statement)).scalar_one_or_none()

    async def get_active_lookup_id(
        self,
        db: AsyncSession,
        model: type[Base],
        code: str,
    ) -> int | None:
        lookup_table = model.__table__
        statement = select(lookup_table.c.id).where(
            lookup_table.c.code == code,
            lookup_table.c.is_deleted.is_(False),
            lookup_table.c.is_deprecated.is_(False),
        )
        return (await db.execute(statement)).scalar_one_or_none()

    async def source_environment_exists(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        source_environment_uuid: uuid_pkg.UUID,
    ) -> bool:
        statement = (
            select(ApplicationConfiguration.id)
            .select_from(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == source_environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
                Tenant.code.in_(("test", "staging")),
                Tenant.is_deleted.is_(False),
            )
        )
        return (await db.execute(statement)).scalar_one_or_none() is not None

    async def create_environment(
        self,
        db: AsyncSession,
        *,
        application_id: int,
        status_id: int,
        client_type_id: int,
        authentication_protocol_id: int,
        tenant_id: int,
        partner_label: str,
        application_url_en: str,
        application_url_fr: str,
        tenant_code: str,
        status_code: str,
        config: dict[str, object],
    ) -> dict[str, Any]:
        configuration = ApplicationConfiguration(
            application_id=application_id,
            application_configuration_status_id=status_id,
            application_configuration_client_type_id=client_type_id,
            authentication_protocol_id=authentication_protocol_id,
            tenant_id=tenant_id,
            partner_label=partner_label,
            application_url_en=application_url_en,
            application_url_fr=application_url_fr,
            config=config,
        )
        db.add(configuration)
        await db.commit()
        await db.refresh(configuration)
        return {
            "uuid": configuration.uuid,
            "partner_label": configuration.partner_label,
            "tenant_code": tenant_code,
            "status_code": status_code,
            "config": configuration.config,
            "created_at": configuration.created_at,
            "updated_at": configuration.updated_at,
        }

    async def get_application_metadata_by_ibm_application_ids(
        self,
        db: AsyncSession,
        ibm_application_ids: set[str],
    ) -> dict[str, dict[str, Any]]:
        if not ibm_application_ids:
            return {}

        statement = (
            select(
                ApplicationConfiguration.ibm_application_id,
                Application.uuid.label("application_uuid"),
                func.count(ApplicationConfiguration.id).label("environment_count"),
            )
            .select_from(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                ApplicationConfiguration.ibm_application_id.in_(ibm_application_ids),
                ApplicationConfiguration.is_deleted.is_(False),
                Application.is_deleted.is_(False),
            )
            .group_by(
                ApplicationConfiguration.ibm_application_id,
                Application.uuid,
            )
        )
        metadata_rows = (await db.execute(statement)).mappings().all()
        return {
            str(row["ibm_application_id"]): {
                "application_uuid": row["application_uuid"],
                "environment_count": int(row["environment_count"]),
            }
            for row in metadata_rows
            if row["ibm_application_id"] is not None
        }

    async def get_application_summary(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any] | None:
        statement = select(
            Application.uuid,
            Application.name_en,
            Application.name_fr,
        ).where(
            Application.uuid == application_uuid,
            Application.is_deleted.is_(False),
        )
        result = await db.execute(statement)
        summary = result.mappings().one_or_none()
        return dict(summary) if summary is not None else None

    async def list_environments(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        offset: int,
        limit: int,
    ) -> dict[str, Any]:
        conditions = (
            ApplicationConfiguration.application_id == Application.id,
            Application.uuid == application_uuid,
            Application.is_deleted.is_(False),
            ApplicationConfiguration.is_deleted.is_(False),
            ApplicationConfigurationStatus.is_deleted.is_(False),
            Tenant.is_deleted.is_(False),
        )
        statement = (
            select(
                ApplicationConfiguration.uuid,
                ApplicationConfiguration.partner_label,
                Tenant.code.label("tenant_code"),
                ApplicationConfigurationStatus.code.label("status_code"),
                ApplicationConfiguration.config,
                ApplicationConfiguration.created_at,
                ApplicationConfiguration.updated_at,
            )
            .select_from(Application)
            .join(
                ApplicationConfiguration,
                ApplicationConfiguration.application_id == Application.id,
            )
            .join(
                ApplicationConfigurationStatus,
                ApplicationConfigurationStatus.id == ApplicationConfiguration.application_configuration_status_id,
            )
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(*conditions)
            .order_by(
                func.coalesce(
                    ApplicationConfiguration.updated_at,
                    ApplicationConfiguration.created_at,
                ).desc(),
                ApplicationConfiguration.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        count_statement = (
            select(func.count())
            .select_from(Application)
            .join(
                ApplicationConfiguration,
                ApplicationConfiguration.application_id == Application.id,
            )
            .join(
                ApplicationConfigurationStatus,
                ApplicationConfigurationStatus.id == ApplicationConfiguration.application_configuration_status_id,
            )
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(*conditions)
        )
        environments = (await db.execute(statement)).mappings().all()
        total_count = (await db.execute(count_statement)).scalar_one()
        return {
            "data": [dict(environment) for environment in environments],
            "total_count": int(total_count),
        }

    async def get_environment(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any] | None:
        statement = (
            select(
                ApplicationConfiguration.uuid,
                ApplicationConfiguration.partner_label,
                Tenant.code.label("tenant_code"),
                ApplicationConfigurationStatus.code.label("status_code"),
                ApplicationConfiguration.config,
                ApplicationConfiguration.created_at,
                ApplicationConfiguration.updated_at,
            )
            .select_from(Application)
            .join(
                ApplicationConfiguration,
                ApplicationConfiguration.application_id == Application.id,
            )
            .join(
                ApplicationConfigurationStatus,
                ApplicationConfigurationStatus.id == ApplicationConfiguration.application_configuration_status_id,
            )
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
                ApplicationConfigurationStatus.is_deleted.is_(False),
                Tenant.is_deleted.is_(False),
            )
        )
        environment = (await db.execute(statement)).mappings().one_or_none()
        return dict(environment) if environment is not None else None

    async def update_environment_name(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        environment_name: str,
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        configuration.partner_label = environment_name
        configuration.config = {
            **(configuration.config or {}),
            "environmentName": environment_name,
        }
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_url(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        application_url: str,
        config_key: Literal["applicationUrlEn", "applicationUrlFr"],
        url_field: Literal["application_url_en", "application_url_fr"],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        setattr(configuration, url_field, application_url)
        configuration.config = {
            **(configuration.config or {}),
            config_key: application_url,
        }
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_redirect_uris(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        redirect_uris: list[str],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        configuration.config = {
            **(configuration.config or {}),
            "redirectUris": redirect_uris,
        }
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_post_logout_redirect_uris(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        post_logout_redirect_uris: list[str],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        configuration.config = {
            **(configuration.config or {}),
            "postLogoutRedirectUris": post_logout_redirect_uris,
        }
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_single_sign_out(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        single_sign_out: bool,
        logout_method: str | None,
        sign_out_request_url: str | None,
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "singleSignOut": single_sign_out,
        }
        if single_sign_out:
            updated_config.update(
                {
                    "logoutMethod": logout_method,
                    "signOutRequestUrl": sign_out_request_url,
                }
            )
        else:
            updated_config.pop("logoutMethod", None)
            updated_config.pop("signOutRequestUrl", None)

        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_client_type(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        client_type_id: int,
        client_type: Literal["public", "confidential"],
        pkce_supported: bool,
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "clientType": client_type,
            "pkceSupported": pkce_supported,
        }
        if client_type == "public":
            updated_config.pop("clientAuthMethod", None)
            updated_config.pop("jwksUri", None)

        configuration.application_configuration_client_type_id = client_type_id
        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_authentication_method(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        client_auth_method: Literal[
            "private_key_jwt",
            "client_secret_basic",
            "client_secret_post",
        ],
        jwks_uri: str | None,
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "clientAuthMethod": client_auth_method,
        }
        if client_auth_method == "private_key_jwt":
            updated_config["jwksUri"] = jwks_uri
        else:
            updated_config.pop("jwksUri", None)

        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_sector_identifier(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        sector_identifier_url: str | None,
        shares_identifier: bool,
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "sharesIdentifier": shares_identifier,
        }
        if shares_identifier:
            updated_config["sectorIdentifierUrl"] = sector_identifier_url
        else:
            updated_config.pop("sectorIdentifierUrl", None)

        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_verification(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        verification_messages: Sequence[str],
        verification_signature_algorithms: Sequence[str],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "verificationMessages": verification_messages,
            "verificationSignatureAlgorithms": verification_signature_algorithms,
        }
        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_signing(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        can_sign_messages: bool,
        signing_messages: Sequence[str],
        signing_signature_algorithms: Sequence[str],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "canSignMessages": can_sign_messages,
            "signingMessages": signing_messages,
            "signingSignatureAlgorithms": signing_signature_algorithms,
        }
        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_encryption(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        can_encrypt_requests: bool,
        encryption_key_algorithms: Sequence[str],
        encryption_content_algorithms: Sequence[str],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "canEncryptRequests": can_encrypt_requests,
            "encryptionKeyAlgorithms": encryption_key_algorithms,
            "encryptionContentAlgorithms": encryption_content_algorithms,
        }
        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def update_environment_decryption(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        can_decrypt_messages: bool,
        decryption_messages: Sequence[str],
        decryption_key_algorithms: Sequence[str],
        decryption_content_algorithms: Sequence[str],
    ) -> dict[str, Any] | None:
        statement = (
            select(ApplicationConfiguration)
            .join(Application, Application.id == ApplicationConfiguration.application_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
            )
        )
        configuration = (await db.execute(statement)).scalar_one_or_none()
        if configuration is None:
            return None

        updated_config = {
            **(configuration.config or {}),
            "canDecryptMessages": can_decrypt_messages,
            "decryptionMessages": decryption_messages,
            "decryptionKeyAlgorithms": decryption_key_algorithms,
            "decryptionContentAlgorithms": decryption_content_algorithms,
        }
        configuration.config = updated_config
        configuration.updated_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(configuration)
        return await self.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )

    async def get_client_secret_context(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any] | None:
        statement = (
            select(
                ApplicationConfiguration.uuid,
                ApplicationConfiguration.partner_label,
                ApplicationConfiguration.ibm_application_id,
                ApplicationConfiguration.ibm_client_id,
                Tenant.code.label("tenant_code"),
            )
            .select_from(Application)
            .join(
                ApplicationConfiguration,
                ApplicationConfiguration.application_id == Application.id,
            )
            .join(Tenant, Tenant.id == ApplicationConfiguration.tenant_id)
            .where(
                Application.uuid == application_uuid,
                Application.is_deleted.is_(False),
                ApplicationConfiguration.uuid == environment_uuid,
                ApplicationConfiguration.is_deleted.is_(False),
                Tenant.is_deleted.is_(False),
            )
        )
        environment = (await db.execute(statement)).mappings().one_or_none()
        return dict(environment) if environment is not None else None


application_environment_repository = ApplicationEnvironmentRepository()
