"""Bounded IBM Security Verify adapter for RP configuration and MAU work.

This service is not a generic provider-administration surface. Its remaining
operations are called only by the portal workflows that own RP setup, secrets,
or scoped usage data.
"""

from collections.abc import Mapping
from typing import Any, cast

from ..core.exceptions.http_exceptions import BadRequestException, NotFoundException
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient


class IBMVerifyAdminService:
    """Provider adapter limited to approved RP and usage operations."""

    _SUPPORTED_RP_SETUP_FIELDS = (
        "name",
        "description",
        "application_url",
        "redirect_uris",
        "post_logout_redirect_uris",
        "company_name",
        "client_type",
        "client_auth_method",
        "pkce_enabled",
        "pkce_enabled_force",
        "logout_method",
        "logout_uri",
        "jwks_uri",
        "owners",
    )

    def __init__(self, client: IBMVerifyAdminClient) -> None:
        self._client = client

    def collect_supported_rp_setup_fields(self, rp_setup: Mapping[str, Any]) -> dict[str, Any]:
        """Collect the RP setup fields currently supported by the IBM Verify adapter."""
        # TODO: Expand this collector when the IBM Verify SDK/package supports the
        # remaining RP setup questionnaire fields needed by workspace-scoped flows.
        return {field: rp_setup[field] for field in self._SUPPORTED_RP_SETUP_FIELDS if field in rp_setup and rp_setup[field] is not None}

    def _normalize_redirect_uris(self, raw_value: Any) -> list[str]:
        """Normalize redirect URIs from form input or JSON arrays."""
        if not raw_value:
            return []
        if isinstance(raw_value, list):
            return [str(line).strip() for line in raw_value if str(line).strip()]
        return [line.strip() for line in str(raw_value).splitlines() if line.strip()]

    def _normalize_checkbox(self, raw_value: Any) -> str:
        """Normalize checkbox value to 'true' or 'false' string."""
        if raw_value is None:
            return "false"
        if isinstance(raw_value, bool):
            return "true" if raw_value else "false"
        return "true" if str(raw_value).strip().lower() in {"true", "1", "yes", "on"} else "false"

    def build_application_creation_payload(self, form_data: dict[str, Any], owners: list[str]) -> dict[str, Any]:
        """Build IBM Verify application creation payload from form data.

        Handles OIDC configuration, client types, and various authentication methods.
        """
        name = str(form_data.get("name") or "").strip()
        description = str(form_data.get("description") or "").strip()
        company_name = str(form_data.get("company_name") or "").strip()
        application_url = str(form_data.get("application_url") or "").strip()
        redirect_uris = self._normalize_redirect_uris(form_data.get("redirect_uris"))
        pkce_enabled = self._normalize_checkbox(form_data.get("pkce_enabled") or form_data.get("pkce_enabled_force"))

        client_type = str(form_data.get("client_type") or "").strip() or None
        client_auth_method = str(form_data.get("client_auth_method") or "").strip() or None
        post_logout_redirect_uris = self._normalize_redirect_uris(form_data.get("post_logout_redirect_uris"))
        logout_uri = str(form_data.get("logout_uri") or "").strip()
        logout_method = str(form_data.get("logout_method") or "").strip()

        if client_type == "confidential" and not client_auth_method:
            client_auth_method = "client_secret_basic"
        if client_type == "public":
            pkce_enabled = "true"

        jwks_uri_value = str(form_data.get("jwks_uri") or "").strip()
        if client_auth_method == "private_key_jwt" and not jwks_uri_value:
            raise BadRequestException("jwks_uri is required for private_key_jwt")

        payload: dict[str, Any] = {
            "visibleOnLaunchpad": True,
            "customization": {"themeId": "default"},
            "name": name,
            "applicationState": True,
            "description": description,
            "templateId": "998",
            "owners": owners,
            "provisioning": {
                "policies": {
                    "provPolicy": "disabled",
                    "deProvPolicy": "disabled",
                    "deProvAction": "delete",
                    "adoptionPolicy": {
                        "matchingAttributes": [],
                        "remediationPolicy": {"policy": "NONE"},
                    },
                    "gracePeriod": 30,
                },
                "attributeMappings": [],
                "reverseAttributeMappings": [],
            },
            "attributeMappings": [],
            "providers": {
                "sso": {"userOptions": "oidc"},
                "oidc": {
                    "properties": {
                        "doNotGenerateClientSecret": "false",
                        "additionalConfig": {
                            "oidcv3": True,
                            "requestObjectParametersOnly": "false",
                            "requestObjectSigningAlg": "RS256",
                            "requestObjectRequireExp": "true",
                            "certificateBoundAccessTokens": "false",
                            "dpopBoundAccessTokens": "false",
                            "validateDPoPProofJti": "false",
                            "dpopProofSigningAlg": "RS256",
                            "authorizeRspSigningAlg": "RS256",
                            "authorizeRspEncryptionAlg": "none",
                            "authorizeRspEncryptionEnc": "none",
                            "responseTypes": ["none", "code"],
                            "responseModes": [
                                "query",
                                "fragment",
                                "form_post",
                                "query.jwt",
                                "fragment.jwt",
                                "form_post.jwt",
                            ],
                            "clientAuthMethod": "default",
                            "requirePushAuthorize": "false",
                            "requestObjectMaxExpFromNbf": 1800,
                            "exchangeForSSOSessionOption": "default",
                            "subjectTokenTypes": ["urn:ietf:params:oauth:token-type:access_token"],
                            "actorTokenTypes": ["urn:ietf:params:oauth:token-type:access_token"],
                            "requestedTokenTypes": ["urn:ietf:params:oauth:token-type:access_token"],
                            "actorTokenRequired": False,
                            "logoutOption": "none",
                            "sessionRequired": False,
                            "requestUris": [],
                            "allowedClientAssertionVerificationKeys": [],
                        },
                        "generateRefreshToken": "true",
                        "renewRefreshToken": "true",
                        "idTokenEncryptAlg": "none",
                        "idTokenEncryptEnc": "none",
                        "grantTypes": {
                            "authorizationCode": "true",
                            "implicit": "false",
                            "clientCredentials": "false",
                            "ropc": "false",
                            "tokenExchange": "false",
                            "deviceFlow": "false",
                            "jwtBearer": "false",
                            "policyAuth": "false",
                        },
                        "accessTokenExpiry": 3600,
                        "refreshTokenExpiry": 86400,
                        "idTokenSigningAlg": "RS256",
                        "renewRefreshTokenExpiry": 86400,
                        "redirectUris": redirect_uris,
                    },
                    "token": {"accessTokenType": "default", "audiences": []},
                    "grantProperties": {"generateDeviceFlowQRCode": "false"},
                    "requirePkceVerification": pkce_enabled,
                    "consentAction": "always_prompt",
                    "applicationUrl": application_url,
                    "scopes": [],
                    "restrictEntitlements": True,
                    "entitlements": [],
                },
                "saml": {"properties": {"companyName": company_name or None, "uniqueID": ""}},
            },
            "apiAccessClients": [],
        }

        if client_type == "public":
            payload["providers"]["oidc"]["properties"]["doNotGenerateClientSecret"] = "true"
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["clientAuthMethod"] = "default"
            payload["providers"]["oidc"]["requirePkceVerification"] = "true"
        elif client_type == "confidential":
            if client_auth_method and client_auth_method != "default":
                payload["providers"]["oidc"]["properties"]["additionalConfig"]["clientAuthMethod"] = client_auth_method
            if client_auth_method == "private_key_jwt" and jwks_uri_value:
                payload["providers"]["oidc"]["properties"]["jwksUri"] = jwks_uri_value

        if logout_method:
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutOption"] = logout_method
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["sessionRequired"] = True if logout_method != "none" else False
        if logout_method != "none" and logout_uri:
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutURI"] = logout_uri
        if logout_method != "none" and post_logout_redirect_uris:
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutRedirectURIs"] = post_logout_redirect_uris

        return payload

    async def build_application_update_payload(
        self,
        application_id: str,
        form_data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Build IBM Verify application update payload by fetching current state.

        Fetches the current application details and returns a payload that can be
        used for partial updates while preserving existing values.
        """
        current_detail_response = await self._client.get_application_detail(application_id)
        current_detail = current_detail_response.model_dump(by_alias=True, exclude_none=True)
        if not current_detail:
            raise NotFoundException(f"Application with ID {application_id} not found.")

        payload: dict[str, Any] = {
            "name": current_detail.get("name", ""),
            "templateId": current_detail.get("templateId", "998"),
            "description": current_detail.get("description", ""),
            "visibleOnLaunchpad": current_detail.get("visibleOnLaunchpad", True),
            "applicationState": current_detail.get("applicationState", True),
            "owners": current_detail.get("owners", []),
            "provisioning": current_detail.get("provisioning", {}),
            "customization": current_detail.get("customization", {"themeId": "default"}),
            "apiAccessClients": current_detail.get("apiAccessClients", []),
            "attributeMappings": current_detail.get("attributeMappings", []),
        }

        if "providers" in current_detail:
            payload["providers"] = current_detail["providers"]

        if form_data is None:
            return payload

        if "name" in form_data:
            payload["name"] = str(form_data["name"] or "").strip()
        if "description" in form_data:
            payload["description"] = str(form_data["description"] or "").strip()
        if "owners" in form_data and form_data["owners"] is not None:
            payload["owners"] = form_data["owners"]

        providers = payload.setdefault("providers", {})
        oidc = providers.setdefault("oidc", {})
        oidc_properties = oidc.setdefault("properties", {})
        additional_config = oidc_properties.setdefault("additionalConfig", {})

        if "application_url" in form_data:
            oidc["applicationUrl"] = str(form_data["application_url"] or "").strip()
        if "redirect_uris" in form_data:
            oidc_properties["redirectUris"] = self._normalize_redirect_uris(form_data.get("redirect_uris"))
        if "pkce_enabled" in form_data:
            oidc["requirePkceVerification"] = self._normalize_checkbox(form_data.get("pkce_enabled"))
        if "company_name" in form_data:
            providers.setdefault("saml", {}).setdefault("properties", {})["companyName"] = str(form_data.get("company_name") or "").strip() or None

        client_type = str(form_data.get("client_type") or "").strip() or None
        client_auth_method = str(form_data.get("client_auth_method") or "").strip() or None
        if client_type == "confidential" and not client_auth_method:
            client_auth_method = "client_secret_basic"
        if client_type == "public":
            oidc_properties["doNotGenerateClientSecret"] = "true"
            additional_config["clientAuthMethod"] = "default"
            oidc["requirePkceVerification"] = "true"
        elif client_auth_method and client_auth_method != "default":
            additional_config["clientAuthMethod"] = client_auth_method

        jwks_uri_value = str(form_data.get("jwks_uri") or "").strip()
        if client_auth_method == "private_key_jwt":
            if not jwks_uri_value:
                raise BadRequestException("jwks_uri is required for private_key_jwt")
            oidc_properties["jwksUri"] = jwks_uri_value

        logout_method = str(form_data.get("logout_method") or "").strip()
        if logout_method:
            additional_config["logoutOption"] = logout_method
            additional_config["sessionRequired"] = logout_method != "none"
        if logout_method != "none" and "logout_uri" in form_data:
            logout_uri = str(form_data.get("logout_uri") or "").strip()
            if logout_uri:
                additional_config["logoutURI"] = logout_uri
        if logout_method != "none" and "post_logout_redirect_uris" in form_data:
            post_logout_redirect_uris = self._normalize_redirect_uris(form_data.get("post_logout_redirect_uris"))
            if post_logout_redirect_uris:
                additional_config["logoutRedirectURIs"] = post_logout_redirect_uris

        return payload

    async def create_application(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a new application."""
        result = await self._client.create_application(payload)
        return cast("dict[str, Any]", result.model_dump(by_alias=True, exclude_none=True))

    async def update_application(self, application_id: str, payload: dict[str, Any]) -> bool:
        """Update an existing application."""
        return await self._client.update_application(application_id, payload)

    async def get_application_total_logins(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict[str, Any]:
        """Get total logins for an application."""
        payload = await self._client.get_application_total_logins(application_id, from_date, to_date)
        return cast("dict[str, Any]", payload.model_dump(by_alias=True, exclude_none=True))

    async def get_client_secret(self, client_id: str) -> dict[str, Any]:
        """Get client secrets for an OIDC client."""
        payload = await self._client.get_client_secret(client_id)
        return cast("dict[str, Any]", payload.model_dump(by_alias=True, exclude_none=True))

    async def update_client_secret(self, client_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Update client secret for an OIDC client."""
        result = await self._client.update_client_secret(client_id, payload)
        return cast("dict[str, Any]", result.model_dump(by_alias=True, exclude_none=True))

    async def delete_rotated_client_secrets(self, client_id: str, path: list[str]) -> bool:
        """Delete rotated client secrets."""
        return await self._client.delete_rotated_client_secrets(client_id, path)

    async def create_application_from_payload(self, payload_data: dict[str, Any], owners: list[str]) -> dict[str, Any]:
        """Create an application from a JSON payload.

        This is a convenience method that builds the payload and creates the application.
        """
        payload = self.build_application_creation_payload(payload_data, owners)
        return await self.create_application(payload)

    async def create_application_from_rp_setup(self, rp_setup: Mapping[str, Any], owners: list[str]) -> dict[str, Any]:
        """Create an application from the currently supported RP setup fields."""
        payload_data = self.collect_supported_rp_setup_fields(rp_setup)
        return await self.create_application_from_payload(payload_data, owners)

    async def update_application_from_payload(self, application_id: str, payload_data: dict[str, Any]) -> bool:
        """Update an application from a JSON payload.

        Fetches current state, merges with the payload, and updates.
        """
        current_payload = await self.build_application_update_payload(application_id, payload_data)
        return await self.update_application(application_id, current_payload)

    async def update_application_from_rp_setup(self, application_id: str, rp_setup: Mapping[str, Any]) -> bool:
        """Update an application from the currently supported RP setup fields."""
        payload_data = self.collect_supported_rp_setup_fields(rp_setup)
        return await self.update_application_from_payload(application_id, payload_data)
