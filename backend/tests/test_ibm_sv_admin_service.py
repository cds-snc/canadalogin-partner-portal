from unittest.mock import AsyncMock, Mock

import pytest

from src.app.core.exceptions.http_exceptions import BadRequestException
from src.app.services.ibm_sv_admin_service import IBMVerifyAdminService


class TestIBMVerifyAdminServiceApplicationPayloads:
    def test_build_application_creation_payload_accepts_structured_json_values(self) -> None:
        service = IBMVerifyAdminService(Mock())

        payload = service.build_application_creation_payload(
            {
                "name": "[TBS] - Application One",
                "description": "Example application",
                "application_url": "https://example.gc.ca",
                "redirect_uris": ["https://example.gc.ca/callback"],
                "client_type": "confidential",
                "client_auth_method": "client_secret_basic",
                "pkce_enabled": True,
                "logout_method": "frontchannel",
                "logout_uri": "https://example.gc.ca/logout",
                "post_logout_redirect_uris": ["https://example.gc.ca/post-logout"],
                "company_name": "Treasury Board Secretariat",
            },
            owners=["owner-1"],
        )

        assert payload["name"] == "[TBS] - Application One"
        assert payload["owners"] == ["owner-1"]
        assert payload["providers"]["oidc"]["properties"]["redirectUris"] == [
            "https://example.gc.ca/callback"
        ]
        assert payload["providers"]["oidc"]["requirePkceVerification"] == "true"
        assert payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutOption"] == "frontchannel"
        assert payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutRedirectURIs"] == [
            "https://example.gc.ca/post-logout"
        ]
        assert payload["providers"]["saml"]["properties"]["companyName"] == "Treasury Board Secretariat"


class TestIBMVerifyAdminServiceAuditReportNormalization:
    def test_normalize_audit_report_builds_quoted_search_after_token(self) -> None:
        service = IBMVerifyAdminService(Mock())

        payload = {
            "response": {
                "report": {
                    "hits": [
                        {
                            "_id": "3dcd5307-1714-4b81-9ce1-f926ec1a3a45",
                            "_source": {
                                "data": {
                                    "origin": "192.0.2.10",
                                    "result": "SUCCESS",
                                    "username": "jane.doe@example.com",
                                },
                                "geoip": {"country_name": "Canada"},
                                "time": 1774982586111,
                            },
                            "sort": ["1774982586111", "3dcd5307-1714-4b81-9ce1-f926ec1a3a45"],
                        }
                    ],
                    "total": 1,
                }
            }
        }

        result = service._normalize_audit_report(payload)

        assert result["next"] == '"1774982586111", "3dcd5307-1714-4b81-9ce1-f926ec1a3a45"'
        assert result["total"] == 1

    def test_build_application_creation_payload_requires_jwks_for_private_key_jwt(self) -> None:
        service = IBMVerifyAdminService(Mock())

        with pytest.raises(BadRequestException, match="jwks_uri is required"):
            service.build_application_creation_payload(
                {
                    "name": "[TBS] - Application One",
                    "client_type": "confidential",
                    "client_auth_method": "private_key_jwt",
                },
                owners=[],
            )

    @pytest.mark.asyncio
    async def test_build_application_update_payload_merges_structured_json_fields(self) -> None:
        mock_client = Mock()
        mock_client.get_application_detail = AsyncMock(
            return_value={
                "name": "[TBS] - Application One",
                "templateId": "998",
                "description": "Old description",
                "visibleOnLaunchpad": True,
                "applicationState": True,
                "owners": ["owner-1"],
                "provisioning": {},
                "customization": {"themeId": "default"},
                "apiAccessClients": [],
                "attributeMappings": [],
                "providers": {
                    "oidc": {
                        "properties": {
                            "redirectUris": ["https://old.example/callback"],
                            "doNotGenerateClientSecret": "false",
                            "additionalConfig": {
                                "clientAuthMethod": "client_secret_basic",
                                "logoutOption": "none",
                                "sessionRequired": False,
                            },
                        },
                        "applicationUrl": "https://old.example",
                        "requirePkceVerification": "false",
                    },
                    "saml": {"properties": {"companyName": "Old Company", "uniqueID": ""}},
                },
            }
        )

        service = IBMVerifyAdminService(mock_client)
        payload = await service.build_application_update_payload(
            "ibm-app-123",
            {
                "name": "[TBS] - Renamed App",
                "description": "Updated description",
                "application_url": "https://example.gc.ca",
                "redirect_uris": ["https://example.gc.ca/callback"],
                "pkce_enabled": True,
                "logout_method": "frontchannel",
                "logout_uri": "https://example.gc.ca/logout",
                "post_logout_redirect_uris": ["https://example.gc.ca/post-logout"],
                "company_name": "Treasury Board Secretariat",
            },
        )

        assert payload["name"] == "[TBS] - Renamed App"
        assert payload["description"] == "Updated description"
        assert payload["providers"]["oidc"]["applicationUrl"] == "https://example.gc.ca"
        assert payload["providers"]["oidc"]["properties"]["redirectUris"] == [
            "https://example.gc.ca/callback"
        ]
        assert payload["providers"]["oidc"]["requirePkceVerification"] == "true"
        assert payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutOption"] == "frontchannel"
        assert payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutURI"] == "https://example.gc.ca/logout"
        assert payload["providers"]["oidc"]["properties"]["additionalConfig"]["logoutRedirectURIs"] == [
            "https://example.gc.ca/post-logout"
        ]
        assert payload["providers"]["saml"]["properties"]["companyName"] == "Treasury Board Secretariat"
