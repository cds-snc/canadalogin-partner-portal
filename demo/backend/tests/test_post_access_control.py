from unittest.mock import AsyncMock, patch

from src.app.main import app

from .test_access_control_integration import build_test_client, make_enforcer, override_dependencies


class TestPostApprovalAccessControl:
    def test_approve_route_allows_user_with_posts_approve_policy(self) -> None:
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        override_dependencies(
            {"id": 7, "username": "reviewer", "is_superuser": False},
            make_enforcer(("reviewer", "posts", "approve")),
        )

        try:
            with build_test_client() as client:
                with patch("src.app.api.v1.posts.PostService.approve_post", new=AsyncMock(return_value={"message": "Post approved"})) as mock_approve:
                    response = client.post(f"/api/v1/posts/{post_uuid}/approve", json={"comment": "Looks good"})
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.json() == {"message": "Post approved"}
        mock_approve.assert_awaited_once()

    def test_approve_route_denies_user_without_posts_approve_policy(self) -> None:
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        override_dependencies(
            {"id": 7, "username": "reviewer", "is_superuser": False},
            make_enforcer(),
        )

        try:
            with build_test_client() as client:
                with patch("src.app.api.v1.posts.PostService.approve_post", new=AsyncMock()) as mock_approve:
                    response = client.post(f"/api/v1/posts/{post_uuid}/approve", json={"comment": "Looks good"})
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 403
        mock_approve.assert_not_called()
