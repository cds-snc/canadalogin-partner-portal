import uuid as uuid_pkg
from typing import Any

from fastcrud import compute_offset, paginated_response
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.exceptions.http_exceptions import BadRequestException, NotFoundException
from ..models.application_configuration_client_type import ApplicationConfigurationClientType
from ..models.application_configuration_status import ApplicationConfigurationStatus
from ..models.authentication_protocol import AuthenticationProtocol
from ..models.tenant import Tenant
from ..repositories.application_environment_repository import application_environment_repository
from ..schemas.application_environment import (
    ApplicationEnvironmentCreate,
    ApplicationEnvironmentNameUpdate,
    ApplicationEnvironmentUpdate,
)


class ApplicationEnvironmentService:
    async def get_application_environment(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
    ) -> dict[str, Any]:
        environment = await application_environment_repository.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )
        if environment is None:
            raise NotFoundException("Application environment not found")
        return environment

    async def create_application_environment(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment: ApplicationEnvironmentCreate,
    ) -> dict[str, Any]:
        application_id = await application_environment_repository.get_application_id(
            db=db,
            application_uuid=application_uuid,
        )
        if application_id is None:
            raise NotFoundException("Application not found")

        if environment.copy_existing and environment.source_environment_uuid is not None:
            if not await application_environment_repository.source_environment_exists(
                db=db,
                application_uuid=application_uuid,
                source_environment_uuid=environment.source_environment_uuid,
            ):
                raise BadRequestException("Source environment not found")

        status_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=ApplicationConfigurationStatus,
            code="submitted",
        )
        client_type_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=ApplicationConfigurationClientType,
            code=environment.client_type,
        )
        authentication_protocol_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=AuthenticationProtocol,
            code="oidc",
        )
        tenant_id = await application_environment_repository.get_active_lookup_id(
            db=db,
            model=Tenant,
            code=environment.tenant_code,
        )
        if status_id is None:
            raise BadRequestException("Active status lookup was not found")
        if client_type_id is None:
            raise BadRequestException("Active client type lookup was not found")
        if authentication_protocol_id is None:
            raise BadRequestException("Active authentication protocol lookup was not found")
        if tenant_id is None:
            raise BadRequestException("Active tenant lookup was not found")

        config = environment.model_dump(by_alias=True, exclude_none=True, mode="json")
        return await application_environment_repository.create_environment(
            db=db,
            application_id=application_id,
            status_id=status_id,
            client_type_id=client_type_id,
            authentication_protocol_id=authentication_protocol_id,
            tenant_id=tenant_id,
            partner_label=environment.environment_name,
            application_url_en=str(environment.application_url_en),
            application_url_fr=str(environment.application_url_fr),
            tenant_code=environment.tenant_code,
            status_code="submitted",
            config=config,
        )

    async def update_application_environment_name(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        environment_uuid: uuid_pkg.UUID,
        environment: ApplicationEnvironmentNameUpdate | ApplicationEnvironmentUpdate,
    ) -> dict[str, Any]:
        current_environment = await application_environment_repository.get_environment(
            db=db,
            application_uuid=application_uuid,
            environment_uuid=environment_uuid,
        )
        if current_environment is None:
            raise NotFoundException("Application environment not found")
        if current_environment["tenant_code"] == "production":
            raise BadRequestException("Production environments cannot be modified")

        if environment.environment_name is not None:
            environment_name = f"{current_environment['tenant_code'].upper()}-{environment.environment_name}"
            if len(environment_name) > 64:
                raise BadRequestException("Environment name is too long")

            updated_environment = await application_environment_repository.update_environment_name(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                environment_name=environment_name,
            )
        elif environment.redirect_uris is not None:
            updated_environment = await application_environment_repository.update_environment_redirect_uris(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                redirect_uris=[str(uri) for uri in environment.redirect_uris],
            )
        elif environment.post_logout_redirect_uris is not None:
            updated_environment = await application_environment_repository.update_environment_post_logout_redirect_uris(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                post_logout_redirect_uris=[
                    str(uri) for uri in environment.post_logout_redirect_uris
                ],
            )
        elif environment.single_sign_out is not None:
            if (
                current_environment["tenant_code"] == "staging"
                and environment.single_sign_out is False
            ):
                raise BadRequestException(
                    "Single sign-out is required for staging environments"
                )
            updated_environment = await application_environment_repository.update_environment_single_sign_out(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                single_sign_out=environment.single_sign_out,
                logout_method=environment.logout_method,
                sign_out_request_url=(
                    str(environment.sign_out_request_url)
                    if environment.sign_out_request_url is not None
                    else None
                ),
            )
        elif environment.client_type is not None:
            if environment.pkce_supported is None:
                raise BadRequestException(
                    "Client type and PKCE support must be provided together"
                )
            client_type_id = await application_environment_repository.get_active_lookup_id(
                db=db,
                model=ApplicationConfigurationClientType,
                code=environment.client_type,
            )
            if client_type_id is None:
                raise BadRequestException("Active client type lookup was not found")
            updated_environment = await application_environment_repository.update_environment_client_type(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                client_type_id=client_type_id,
                client_type=environment.client_type,
                pkce_supported=environment.pkce_supported,
            )
        elif environment.client_auth_method is not None:
            updated_environment = await application_environment_repository.update_environment_authentication_method(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                client_auth_method=environment.client_auth_method,
                jwks_uri=(
                    str(environment.jwks_uri)
                    if environment.jwks_uri is not None
                    else None
                ),
            )
        elif environment.can_sign_messages is not None:
            updated_environment = await application_environment_repository.update_environment_signing(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                can_sign_messages=environment.can_sign_messages,
                signing_messages=environment.signing_messages or [],
                signing_signature_algorithms=(
                    environment.signing_signature_algorithms or []
                ),
            )
        elif environment.can_encrypt_requests is not None:
            updated_environment = await application_environment_repository.update_environment_encryption(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                can_encrypt_requests=environment.can_encrypt_requests,
                encryption_key_algorithms=environment.encryption_key_algorithms or [],
                encryption_content_algorithms=(
                    environment.encryption_content_algorithms or []
                ),
            )
        elif environment.can_decrypt_messages is not None:
            updated_environment = await application_environment_repository.update_environment_decryption(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                can_decrypt_messages=environment.can_decrypt_messages,
                decryption_messages=environment.decryption_messages or [],
                decryption_key_algorithms=environment.decryption_key_algorithms or [],
                decryption_content_algorithms=(
                    environment.decryption_content_algorithms or []
                ),
            )
        elif environment.verification_messages is not None:
            updated_environment = await application_environment_repository.update_environment_verification(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                verification_messages=environment.verification_messages,
                verification_signature_algorithms=(
                    environment.verification_signature_algorithms or []
                ),
            )
        elif environment.application_url_en is not None:
            updated_environment = await application_environment_repository.update_environment_url(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                application_url=str(environment.application_url_en),
                config_key="applicationUrlEn",
                url_field="application_url_en",
            )
        else:
            updated_environment = await application_environment_repository.update_environment_url(
                db=db,
                application_uuid=application_uuid,
                environment_uuid=environment_uuid,
                application_url=str(environment.application_url_fr),
                config_key="applicationUrlFr",
                url_field="application_url_fr",
            )
        if updated_environment is None:
            raise NotFoundException("Application environment not found")
        return updated_environment

    async def list_application_environments(
        self,
        db: AsyncSession,
        application_uuid: uuid_pkg.UUID,
        page: int,
        items_per_page: int,
    ) -> dict[str, Any]:
        application = await application_environment_repository.get_application_summary(
            db=db,
            application_uuid=application_uuid,
        )
        if application is None:
            raise NotFoundException("Application not found")

        environments = await application_environment_repository.list_environments(
            db=db,
            application_uuid=application_uuid,
            offset=compute_offset(page, items_per_page),
            limit=items_per_page,
        )
        return {
            "application": application,
            **paginated_response(
                crud_data=environments,
                page=page,
                items_per_page=items_per_page,
            ),
        }
