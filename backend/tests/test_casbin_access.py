from unittest.mock import Mock, call

import pytest

from src.app.core.access_control import (
    MultiSubjectEnforcer,
    canonical_enforcer_provider,
    get_casbin_subject,
)


class TestCasbinSubjectProvider:
    @pytest.mark.asyncio
    async def test_get_casbin_subject_returns_canonical_cl_admin(self):
        subject = await get_casbin_subject(
            {
                "authorization_context": {
                    "globalRole": "cl_admin",
                    "partnerAccess": [],
                },
                "is_superuser": False,
            }
        )

        assert subject == ["cl_admin"]

    @pytest.mark.asyncio
    async def test_get_casbin_subject_ignores_legacy_superuser_and_username(self):
        subject = await get_casbin_subject({"username": "member", "is_superuser": True, "role_ids": [7]})

        assert subject == []

    @pytest.mark.asyncio
    async def test_get_casbin_subject_deduplicates_canonical_partner_roles(self):
        subject = await get_casbin_subject(
            {
                "authorization_context": {
                    "globalRole": None,
                    "partnerAccess": [
                        {
                            "workspaceUuid": "11111111-1111-4111-8111-111111111111",
                            "role": "rp_user_edit",
                        },
                        {
                            "workspaceUuid": "22222222-2222-4222-8222-222222222222",
                            "role": "rp_user_edit",
                        },
                    ],
                }
            }
        )

        assert subject == ["rp_user_edit"]


class TestMultiSubjectEnforcer:
    @pytest.mark.asyncio
    async def test_enforce_allows_when_any_subject_matches(self):
        enforcer = Mock()
        enforcer.enforce = Mock(side_effect=[False, True])

        wrapped = MultiSubjectEnforcer(enforcer)

        allowed = await wrapped.enforce(["rp_admin", "rp_user_edit"], "users_admin", "read")

        assert allowed is True
        assert enforcer.enforce.call_args_list == [
            call("rp_admin", "users_admin", "read"),
            call("rp_user_edit", "users_admin", "read"),
        ]

    @pytest.mark.asyncio
    async def test_enforce_denies_when_no_subject_matches(self):
        enforcer = Mock()
        enforcer.enforce = Mock(return_value=False)

        wrapped = MultiSubjectEnforcer(enforcer)

        allowed = await wrapped.enforce(["read_only", "member"], "roles", "write")

        assert allowed is False


class TestCanonicalPolicyBoundary:
    @pytest.mark.asyncio
    async def test_cl_admin_rp_application_policy_is_read_only(self):
        enforcer = canonical_enforcer_provider()

        assert await enforcer.enforce("cl_admin", "rp_applications", "read") is True
        assert await enforcer.enforce("cl_admin", "rp_applications", "write") is False
