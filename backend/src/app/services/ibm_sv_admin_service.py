"""IBM Security Verify Admin Service.

This service handles admin-level operations on IBM Security Verify.
It includes data normalization, transformation logic, and application payload builders.
"""

import json
from ipaddress import ip_address
from typing import Any

from ..core.exceptions.http_exceptions import BadRequestException, NotFoundException
from ..repositories.ibm_sv_admin import IBMVerifyAdminClient


class IBMVerifyAdminService:
    """Service for IBM Security Verify admin operations."""

    def __init__(self, client: IBMVerifyAdminClient) -> None:
        self._client = client

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
        pkce_enabled = self._normalize_checkbox(
            form_data.get("pkce_enabled") or form_data.get("pkce_enabled_force")
        )

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
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["sessionRequired"] = (
                True if logout_method != "none" else False
            )
        if logout_method != "none" and logout_uri:
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutURI"] = logout_uri
        if logout_method != "none" and post_logout_redirect_uris:
            payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutRedirectURIs"] = (
                post_logout_redirect_uris
            )

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
            providers.setdefault("saml", {}).setdefault("properties", {})["companyName"] = (
                str(form_data.get("company_name") or "").strip() or None
            )

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

    def _normalize_audit_report(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Normalize audit report payload into standardized dict.

        Returns: {"events": [...], "next": <token>|None, "total": <int>|None}
        """
        if isinstance(payload, dict) and isinstance(payload.get("events"), list):
            return {
                "events": payload.get("events", []),
                "next": payload.get("next"),
                "total": payload.get("total"),
            }

        events: list[dict[str, Any]] = []
        next_token: str | None = None
        total: int | None = None

        try:
            report = payload.get("response", {}).get("report", {})
            hits = report.get("hits", []) if isinstance(report, dict) else []

            raw_total: Any = None
            if isinstance(report, dict):
                raw_total = report.get("total")
            if raw_total is None:
                raw_total = payload.get("response", {}).get("report", {}).get("total")
            if isinstance(raw_total, dict):
                total = raw_total.get("value")
            elif isinstance(raw_total, int):
                total = raw_total
            elif isinstance(raw_total, str):
                try:
                    total = int(raw_total)
                except Exception:
                    total = None

            for hit in hits:
                _id = hit.get("_id")
                sort = hit.get("sort") or []
                if sort and isinstance(sort, list) and len(sort) >= 1:
                    timestamp = sort[0]
                else:
                    timestamp = hit.get("_source", {}).get("time")
                src = hit.get("_source", {})
                data = src.get("data", {}) if isinstance(src, dict) else {}
                geo = src.get("geoip", {}) if isinstance(src, dict) else {}
                events.append(
                    {
                        "id": _id,
                        "timestamp": timestamp,
                        "username": data.get("username") or data.get("userid"),
                        "origin": data.get("origin"),
                        "result": data.get("result"),
                        "country": geo.get("country_name") or geo.get("country_iso_code"),
                    }
                )

            if hits:
                last = hits[-1]
                last_sort = last.get("sort") or []
                if last_sort and len(last_sort) >= 2:
                    last_ts = last_sort[0]
                    last_id = last_sort[1]
                else:
                    last_ts = last.get("_source", {}).get("time")
                    last_id = last.get("_id")
                if last_ts is not None and last_id:
                    next_token = ", ".join(
                        json.dumps(str(value)) for value in (last_ts, last_id)
                    )
        except Exception:
            pass

        return {"events": events, "next": next_token, "total": total}

    def _normalize_epoch_seconds(self, raw_value: int | None) -> int | None:
        """Normalize epoch timestamp to seconds (handles milliseconds)."""
        if raw_value is None:
            return None
        try:
            value = int(raw_value)
        except (TypeError, ValueError):
            return None
        if value <= 0:
            return None
        if value > 10**11:
            return value // 1000
        return value

    def _mask_email(self, value: str) -> str:
        """Mask email address for privacy (keep first 2 chars of local part)."""
        value = str(value or "").strip()
        if not value or "@" not in value:
            return value

        local, domain = value.split("@", 1)
        local = local.strip()
        domain = domain.strip()
        if not local or not domain:
            return value

        prefix = local[:2]
        return f"{prefix}***@{domain}"

    def _mask_ip(self, value: str) -> str:
        """Mask IP address for privacy (IPv4: xxx.xxx, IPv6: first 2 parts)."""
        value = str(value or "").strip()
        if not value:
            return value

        try:
            parsed_ip = ip_address(value)
        except ValueError:
            return value

        if parsed_ip.version == 4:
            octets = value.split(".")
            if len(octets) == 4:
                return f"{octets[0]}.{octets[1]}.xxx.xxx"
            return value

        hextets = parsed_ip.exploded.split(":")
        if len(hextets) == 8:
            masked_tail = ["xxxx"] * 6
            return ":".join(hextets[:2] + masked_tail)
        return value

    def parse_audit_trail(self, raw_payload: dict[str, Any]) -> list[dict[str, Any]]:
        """Parse and transform audit trail response.

        Extracts hits, masks sensitive data (emails, IPs), and normalizes timestamps.

        Accepts either upstream shape (dict with response.report.hits) or normalized
        dict with key 'events' containing list of flattened event dicts.
        """
        if isinstance(raw_payload, dict) and "events" in raw_payload:
            events = raw_payload.get("events") or []
            rows: list[dict[str, Any]] = []
            for ev in events:
                username_raw = str(ev.get("username") or ev.get("userid") or "").strip()
                username_known = bool(username_raw) and username_raw.upper() != "UNKNOWN"
                origin_raw = str(ev.get("origin") or "").strip()
                ip_version: int | None = None
                if origin_raw:
                    try:
                        ip_version = ip_address(origin_raw).version
                    except ValueError:
                        ip_version = None
                result_raw = str(ev.get("result") or "").strip().lower()
                time_seconds = self._normalize_epoch_seconds(ev.get("timestamp"))
                country = str(ev.get("country") or "").strip()
                username_display = self._mask_email(username_raw) if username_known else ""
                origin_display = self._mask_ip(origin_raw)
                rows.append(
                    {
                        "username": username_raw,
                        "username_display": username_display,
                        "username_known": username_known,
                        "origin": origin_raw,
                        "origin_display": origin_display,
                        "ip_version": ip_version,
                        "result": result_raw,
                        "time_seconds": time_seconds,
                        "country": country,
                    }
                )
            return rows

        return []

    async def list_users(self) -> list[dict[str, Any]]:
        """List all users."""
        payload = await self._client.fetch_users()
        resources = payload.Resources or []
        return [user.model_dump(by_alias=True, exclude_none=True) for user in resources]

    async def search_users_by_name(self, username: str) -> list[dict[str, Any]]:
        """Search for users by username."""
        payload = await self._client.search_users_by_name(username)
        resources = payload.Resources or []
        return [user.model_dump(by_alias=True, exclude_none=True) for user in resources]

    async def get_application_detail(self, application_id: str) -> dict[str, Any]:
        """Get application details."""
        payload = await self._client.get_application_detail(application_id)
        return payload.model_dump(by_alias=True, exclude_none=True)

    async def create_application(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Create a new application."""
        return await self._client.create_application(payload)

    async def update_application(self, application_id: str, payload: dict[str, Any]) -> bool:
        """Update an existing application."""
        return await self._client.update_application(application_id, payload)

    async def delete_application(self, application_id: str) -> None:
        """Delete an application."""
        await self._client.delete_application(application_id)

    async def get_application_total_logins(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> dict[str, Any]:
        """Get total logins for an application."""
        payload = await self._client.get_application_total_logins(application_id, from_date, to_date)
        return payload.model_dump(by_alias=True, exclude_none=True)

    async def get_application_audit_trail(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
        size: int = 50,
        sort_by: str = "time",
        sort_order: str = "DESC",
    ) -> dict[str, Any]:
        """Get audit trail for an application."""
        payload = await self._client.get_application_audit_trail(
            application_id,
            from_date,
            to_date,
            size,
            sort_by,
            sort_order,
        )
        return self._normalize_audit_report(payload.model_dump(by_alias=True, exclude_none=True))

    async def get_application_audit_trail_search_after(
        self,
        application_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
        size: int = 25,
        search_after: str | None = None,
    ) -> dict[str, Any]:
        """Get audit trail with search_after cursor for pagination."""
        payload = await self._client.app_audit_trail_search_after(
            application_id,
            from_date,
            to_date,
            size=size,
            search_after=search_after,
        )
        return self._normalize_audit_report(payload.model_dump(by_alias=True, exclude_none=True))

    async def get_client_secret(self, client_id: str) -> dict[str, Any]:
        """Get client secrets for an OIDC client."""
        payload = await self._client.get_client_secret(client_id)
        return payload.model_dump(by_alias=True, exclude_none=True)

    async def update_client_secret(self, client_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Update client secret for an OIDC client."""
        result = await self._client.update_client_secret(client_id, payload)
        return result.model_dump(by_alias=True, exclude_none=True)

    async def delete_rotated_client_secrets(self, client_id: str, path: list[str]) -> bool:
        """Delete rotated client secrets."""
        return await self._client.delete_rotated_client_secrets(client_id, path)

    async def get_application_entitlements(self, application_id: str) -> dict[str, Any]:
        """Get entitlements for an application."""
        payload = await self._client.get_application_entitlements(application_id)
        return payload.model_dump(by_alias=True, exclude_none=True)

    async def list_groups(self, count: int = 100, start_index: int = 1) -> list[dict[str, Any]]:
        """List all groups."""
        payload = await self._client.list_groups(count, start_index)
        resources = payload.Resources or []
        return [group.model_dump(by_alias=True, exclude_none=True) for group in resources]

    async def search_groups_by_name(self, group_name: str) -> list[dict[str, Any]]:
        """Search for groups by name."""
        payload = await self._client.search_groups_by_name(group_name)
        resources = payload.Resources or []
        return [group.model_dump(by_alias=True, exclude_none=True) for group in resources]

    async def get_group_by_id(self, group_id: str) -> dict[str, Any]:
        """Get a group by ID."""
        payload = await self._client.get_group_by_id(group_id)
        return payload.model_dump(by_alias=True, exclude_none=True)

    async def add_user_to_group(self, group_id: str, user_id: str) -> None:
        """Add a user to a group."""
        await self._client.add_user_to_group(group_id, user_id)

    async def remove_user_from_group(self, group_id: str, user_id: str) -> None:
        """Remove a user from a group."""
        await self._client.remove_user_from_group(group_id, user_id)

    async def is_user_in_group(self, group_id: str, user_id: str) -> bool:
        """Check if a user is a member of a group."""
        return await self._client.is_user_in_group(group_id, user_id)

    async def create_application_from_payload(self, payload_data: dict[str, Any], owners: list[str]) -> dict[str, Any]:
        """Create an application from a JSON payload.

        This is a convenience method that builds the payload and creates the application.
        """
        payload = self.build_application_creation_payload(payload_data, owners)
        return await self.create_application(payload)

    async def update_application_from_payload(self, application_id: str, payload_data: dict[str, Any]) -> bool:
        """Update an application from a JSON payload.

        Fetches current state, merges with the payload, and updates.
        """
        current_payload = await self.build_application_update_payload(application_id, payload_data)
        return await self.update_application(application_id, current_payload)
