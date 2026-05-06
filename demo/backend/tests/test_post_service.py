from unittest.mock import ANY, AsyncMock, patch

import pytest

from src.app.core.exceptions.http_exceptions import BadRequestException, ForbiddenException
from src.app.schemas.post import PostApprove, PostCreate, PostReject, PostStatus, PostUpdate
from src.app.services.post_service import PostService


class TestPostService:
    @pytest.mark.asyncio
    async def test_create_post_invalidates_user_cache(self) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "is_superuser": False}
        db_user = {"id": 7, "uuid": user_uuid, "username": "author"}
        created_post = {
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "title": "Hello",
            "text": "World",
        }

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                with patch("src.app.services.post_service.invalidate_post_cache", new_callable=AsyncMock) as mock_invalidate:
                    mock_users.get = AsyncMock(return_value=db_user)
                    mock_posts.create = AsyncMock(return_value=created_post)

                    result = await service.create_post(
                        db=AsyncMock(),
                        user_uuid=user_uuid,
                        current_user=current_user,
                        post=PostCreate(title="Hello", text="World", mediaUrl=None),
                    )

        assert result == created_post
        mock_invalidate.assert_awaited_once_with(user_uuid=user_uuid)

    @pytest.mark.asyncio
    async def test_get_post_by_user_uuid_uses_post_uuid(self) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        db_user = {"id": 7, "uuid": user_uuid, "username": "author"}
        db_post = {"id": 11, "uuid": post_uuid, "created_by_user_id": 7, "title": "Hello", "text": "World", "media_url": None}

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                mock_users.get = AsyncMock(return_value=db_user)
                mock_posts.get = AsyncMock(return_value=db_post)

                result = await service.get_post_by_user_uuid(
                    db=AsyncMock(),
                    user_uuid=user_uuid,
                    post_uuid=post_uuid,
                )

        assert result == db_post
        mock_posts.get.assert_awaited_once_with(
            db=ANY,
            uuid=post_uuid,
            created_by_user_id=7,
            is_deleted=False,
            schema_to_select=ANY,
        )

    @pytest.mark.asyncio
    async def test_submit_for_review_creates_approval_history_and_updates_status(self) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        post = {
            "id": 11,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "created_by_user_id": 7,
            "status": PostStatus.DRAFT,
        }
        current_user = {"id": 7, "uuid": user_uuid, "is_superuser": False}
        db_user = {"id": 7, "uuid": user_uuid, "username": "author"}

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                with patch("src.app.services.post_service.crud_post_approvals") as mock_approvals:
                    mock_users.get = AsyncMock(return_value=db_user)
                    mock_posts.get = AsyncMock(return_value=post)
                    mock_posts.update = AsyncMock(return_value=None)
                    mock_approvals.create = AsyncMock(return_value=None)

                    result = await service.submit_for_review(
                        db=AsyncMock(),
                        user_uuid=user_uuid,
                        post_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
                        current_user=current_user,
                    )

        assert result == {"message": "Post submitted for review"}
        mock_posts.update.assert_awaited_once()
        mock_approvals.create.assert_awaited_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("method_name", "expected_message"),
        [
            ("update_post", "Post updated"),
            ("delete_post", "Post deleted"),
            ("submit_for_review", "Post submitted for review"),
        ],
    )
    async def test_author_post_mutations_invalidate_author_cache(self, method_name: str, expected_message: str) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        post = {"id": 11, "uuid": post_uuid, "created_by_user_id": 7, "status": PostStatus.DRAFT}
        db_user = {"id": 7, "uuid": user_uuid, "username": "author"}

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                with patch("src.app.services.post_service.crud_post_approvals") as mock_approvals:
                    with patch("src.app.services.post_service.invalidate_post_cache", new_callable=AsyncMock) as mock_invalidate:
                        mock_users.get = AsyncMock(return_value=db_user)
                        mock_posts.get = AsyncMock(return_value=post)
                        mock_posts.update = AsyncMock(return_value=None)
                        mock_posts.delete = AsyncMock(return_value=None)
                        mock_approvals.create = AsyncMock(return_value=None)

                        kwargs = {
                            "db": AsyncMock(),
                            "user_uuid": user_uuid,
                            "post_uuid": post_uuid,
                            "current_user": current_user,
                        }
                        if method_name == "update_post":
                            kwargs["values"] = PostUpdate(title="Updated title", text="Updated content", mediaUrl=None)

                        result = await getattr(service, method_name)(**kwargs)

        assert result == {"message": expected_message}
        mock_invalidate.assert_awaited_once_with(user_uuid=user_uuid, post_uuid=post_uuid)

    @pytest.mark.asyncio
    async def test_update_post_rejects_author_changes_when_post_is_in_review(self) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "is_superuser": False}
        post = {
            "id": 11,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "created_by_user_id": 7,
            "status": PostStatus.IN_REVIEW,
        }
        db_user = {"id": 7, "uuid": user_uuid, "username": "author"}

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                mock_users.get = AsyncMock(return_value=db_user)
                mock_posts.get = AsyncMock(return_value=post)

                with pytest.raises(BadRequestException, match="Posts in status 'in_review' cannot be edited"):
                    await service.update_post(
                        db=AsyncMock(),
                        user_uuid=user_uuid,
                        post_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
                        current_user=current_user,
                        values=PostUpdate(title="Updated title", text="Updated content", mediaUrl=None),
                    )

    @pytest.mark.asyncio
    async def test_submit_for_review_rejects_non_owner(self) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        post = {
            "id": 11,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "created_by_user_id": 7,
            "status": PostStatus.DRAFT,
        }
        current_user = {"id": 9, "uuid": "019cfc22-bff2-7168-ae43-387a301d8fcc", "is_superuser": False}
        db_user = {"id": 9, "uuid": user_uuid, "username": "author"}

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                mock_users.get = AsyncMock(return_value=db_user)
                mock_posts.get = AsyncMock(return_value=post)

                with pytest.raises(ForbiddenException):
                    await service.submit_for_review(
                        db=AsyncMock(),
                        user_uuid=user_uuid,
                        post_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
                        current_user=current_user,
                    )

    @pytest.mark.asyncio
    async def test_approve_post_creates_approval_history_and_updates_status(self) -> None:
        service = PostService()
        post = {
            "id": 11,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "created_by_user_id": 7,
            "status": PostStatus.IN_REVIEW,
        }
        current_user = {"id": 21, "is_superuser": False}
        author = {
            "id": 7,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f2",
            "username": "author",
        }

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                with patch("src.app.services.post_service.crud_post_approvals") as mock_approvals:
                    mock_users.get = AsyncMock(return_value=author)
                    mock_posts.get = AsyncMock(return_value=post)
                    mock_posts.update = AsyncMock(return_value=None)
                    mock_approvals.create = AsyncMock(return_value=None)

                    result = await service.approve_post(
                        db=AsyncMock(),
                        post_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
                        current_user=current_user,
                        payload=PostApprove(comment="Looks good"),
                    )

        assert result == {"message": "Post approved"}
        mock_posts.update.assert_awaited_once()
        mock_approvals.create.assert_awaited_once()

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        ("method_name", "payload", "expected_message"),
        [
            ("approve_post", PostApprove(comment="Looks good"), "Post approved"),
            ("reject_post", PostReject(comment="Needs work"), "Post rejected"),
        ],
    )
    async def test_review_actions_invalidate_author_cache(self, method_name: str, payload: object, expected_message: str) -> None:
        service = PostService()
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        post = {"id": 11, "uuid": post_uuid, "created_by_user_id": 7, "status": PostStatus.IN_REVIEW}
        current_user = {"id": 21, "is_superuser": False}
        author = {"id": 7, "uuid": user_uuid, "username": "author"}

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                with patch("src.app.services.post_service.crud_post_approvals") as mock_approvals:
                    with patch("src.app.services.post_service.invalidate_post_cache", new_callable=AsyncMock) as mock_invalidate:
                        mock_posts.get = AsyncMock(return_value=post)
                        mock_posts.update = AsyncMock(return_value=None)
                        mock_users.get = AsyncMock(return_value=author)
                        mock_approvals.create = AsyncMock(return_value=None)

                        result = await getattr(service, method_name)(
                            db=AsyncMock(),
                            post_uuid=post_uuid,
                            current_user=current_user,
                            payload=payload,
                        )

        assert result == {"message": expected_message}
        mock_invalidate.assert_awaited_once_with(user_uuid=user_uuid, post_uuid=post_uuid)

    @pytest.mark.asyncio
    async def test_reject_post_creates_approval_history_and_updates_status(self) -> None:
        service = PostService()
        post = {
            "id": 11,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "created_by_user_id": 7,
            "status": PostStatus.IN_REVIEW,
        }
        current_user = {"id": 21, "is_superuser": False}
        author = {
            "id": 7,
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f2",
            "username": "author",
        }

        with patch("src.app.services.post_service.crud_users") as mock_users:
            with patch("src.app.services.post_service.crud_posts") as mock_posts:
                with patch("src.app.services.post_service.crud_post_approvals") as mock_approvals:
                    mock_users.get = AsyncMock(return_value=author)
                    mock_posts.get = AsyncMock(return_value=post)
                    mock_posts.update = AsyncMock(return_value=None)
                    mock_approvals.create = AsyncMock(return_value=None)

                    result = await service.reject_post(
                        db=AsyncMock(),
                        post_uuid="018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
                        current_user=current_user,
                        payload=PostReject(comment="Needs work"),
                    )

        assert result == {"message": "Post rejected"}
        mock_posts.update.assert_awaited_once()
        mock_approvals.create.assert_awaited_once()
