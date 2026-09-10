from src.app.core.access_control import casbin_guard


class TestCasbinSubjectProvider:
    def test_permission_decorator_does_not_wrap_routes(self):
        async def endpoint() -> None:
            return None

        decorated_endpoint = casbin_guard.require_permission("roles", "read")(endpoint)

        assert decorated_endpoint is endpoint
