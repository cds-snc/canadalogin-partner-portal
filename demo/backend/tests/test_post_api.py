from unittest.mock import AsyncMock, Mock, patch

import pytest

from src.app.api.v1.posts import erase_post, patch_post, write_post
from src.app.schemas.post import PostApprove, PostCreate, PostReject, PostUpdate


def unwrap_endpoint(endpoint):
    current = endpoint
    while hasattr(current, "__wrapped__"):
        current = current.__wrapped__
    return current


class TestWritePost:
    @pytest.mark.asyncio
    async def test_write_post_delegates_creation_to_service(self, mock_db) -> None:
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "username": "author", "is_superuser": False}
        payload = PostCreate(title="Hello", text="World")
        created_post = {
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "title": "Hello",
            "text": "World",
        }
        mock_service = Mock()
        mock_service.create_post = AsyncMock(return_value=created_post)

        result = await unwrap_endpoint(write_post)(Mock(), user_uuid, payload, current_user, mock_db, mock_service)

        assert result == created_post
        mock_service.create_post.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            current_user=current_user,
            post=payload,
        )

    @pytest.mark.asyncio
    async def test_write_post_invalidates_paginated_post_cache(self, mock_db, mock_redis) -> None:
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "username": "author", "is_superuser": False}
        payload = PostCreate(title="Hello", text="World")
        request = Mock(method="POST")
        created_post = {
            "uuid": "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1",
            "title": "Hello",
            "text": "World",
        }
        mock_service = Mock()
        mock_service.create_post = AsyncMock(return_value=created_post)
        mock_redis.scan = AsyncMock(return_value=(0, [f"{user_uuid}_posts:page_1:items_per_page:10:{user_uuid}".encode()]))

        with patch("src.app.core.utils.cache.client", mock_redis):
            result = await write_post(
                request,
                user_uuid=user_uuid,
                post=payload,
                current_user=current_user,
                db=mock_db,
                service=mock_service,
            )

        assert result == created_post
        mock_redis.scan.assert_awaited_once_with(0, match=f"{user_uuid}_posts:**", count=100)
        mock_redis.delete.assert_any_await(f"{user_uuid}_posts:{user_uuid}")
        mock_redis.delete.assert_any_await(f"{user_uuid}_posts:page_1:items_per_page:10:{user_uuid}".encode())


class TestPatchPost:
    @pytest.mark.asyncio
    async def test_patch_post_delegates_to_service(self, mock_db) -> None:
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "username": "author", "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        payload = PostUpdate(title="Updated")
        mock_service = Mock()
        mock_service.update_post = AsyncMock(return_value={"message": "Post updated"})

        result = await unwrap_endpoint(patch_post)(Mock(), user_uuid, post_uuid, payload, current_user, mock_db, mock_service)

        assert result == {"message": "Post updated"}
        mock_service.update_post.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            post_uuid=post_uuid,
            current_user=current_user,
            values=payload,
        )

    @pytest.mark.asyncio
    async def test_patch_post_invalidates_paginated_post_cache(self, mock_db, mock_redis) -> None:
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "username": "author", "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        payload = PostUpdate(title="Updated")
        request = Mock(method="PATCH")
        mock_service = Mock()
        mock_service.update_post = AsyncMock(return_value={"message": "Post updated"})
        mock_redis.scan = AsyncMock(return_value=(0, [f"{user_uuid}_posts:page_1:items_per_page:10:{user_uuid}".encode()]))

        with patch("src.app.core.utils.cache.client", mock_redis):
            result = await patch_post(
                request,
                user_uuid=user_uuid,
                post_uuid=post_uuid,
                values=payload,
                current_user=current_user,
                db=mock_db,
                service=mock_service,
            )

        assert result == {"message": "Post updated"}
        mock_redis.scan.assert_awaited_once_with(0, match=f"{user_uuid}_posts:**", count=100)
        mock_redis.delete.assert_any_await(f"{user_uuid}_post_cache:{post_uuid}")
        mock_redis.delete.assert_any_await(f"{user_uuid}_posts:page_1:items_per_page:10:{user_uuid}".encode())


class TestErasePost:
    @pytest.mark.asyncio
    async def test_erase_post_invalidates_paginated_post_cache(self, mock_db, mock_redis) -> None:
        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "username": "author", "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        request = Mock(method="DELETE")
        mock_service = Mock()
        mock_service.delete_post = AsyncMock(return_value={"message": "Post deleted"})
        mock_redis.scan = AsyncMock(return_value=(0, [f"{user_uuid}_posts:page_1:items_per_page:10:{user_uuid}".encode()]))

        with patch("src.app.core.utils.cache.client", mock_redis):
            result = await erase_post(
                request,
                user_uuid=user_uuid,
                post_uuid=post_uuid,
                current_user=current_user,
                db=mock_db,
                service=mock_service,
            )

        assert result == {"message": "Post deleted"}
        mock_redis.scan.assert_awaited_once_with(0, match=f"{user_uuid}_posts:**", count=100)
        mock_redis.delete.assert_any_await(f"{user_uuid}_post_cache:{post_uuid}")
        mock_redis.delete.assert_any_await(f"{user_uuid}_posts:page_1:items_per_page:10:{user_uuid}".encode())


class TestWorkflowEndpoints:
    @pytest.mark.asyncio
    async def test_submit_for_review_endpoint_delegates_to_service(self, mock_db) -> None:
        from src.app.api.v1.posts import submit_post_for_review

        user_uuid = "019cfc22-bff2-7168-ae43-387a301d8fcb"
        current_user = {"id": 7, "uuid": user_uuid, "username": "author", "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        mock_service = Mock()
        mock_service.submit_for_review = AsyncMock(return_value={"message": "Post submitted for review"})

        result = await unwrap_endpoint(submit_post_for_review)(Mock(), user_uuid, post_uuid, current_user, mock_db, mock_service)

        assert result == {"message": "Post submitted for review"}
        mock_service.submit_for_review.assert_awaited_once_with(
            db=mock_db,
            user_uuid=user_uuid,
            post_uuid=post_uuid,
            current_user=current_user,
        )

    @pytest.mark.asyncio
    async def test_approve_post_endpoint_delegates_to_service(self, mock_db) -> None:
        from src.app.api.v1.posts import approve_post

        current_user = {"id": 21, "username": "reviewer", "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        payload = PostApprove(comment="Looks good")
        mock_service = Mock()
        mock_service.approve_post = AsyncMock(return_value={"message": "Post approved"})

        result = await unwrap_endpoint(approve_post)(Mock(), post_uuid, payload, current_user, mock_db, mock_service)

        assert result == {"message": "Post approved"}
        mock_service.approve_post.assert_awaited_once_with(
            db=mock_db,
            post_uuid=post_uuid,
            current_user=current_user,
            payload=payload,
        )

    @pytest.mark.asyncio
    async def test_reject_post_endpoint_delegates_to_service(self, mock_db) -> None:
        from src.app.api.v1.posts import reject_post

        current_user = {"id": 21, "username": "reviewer", "is_superuser": False}
        post_uuid = "018f6f83-0f2b-7b0f-b2fb-96c4d8a4b0f1"
        payload = PostReject(comment="Needs work")
        mock_service = Mock()
        mock_service.reject_post = AsyncMock(return_value={"message": "Post rejected"})

        result = await unwrap_endpoint(reject_post)(Mock(), post_uuid, payload, current_user, mock_db, mock_service)

        assert result == {"message": "Post rejected"}
        mock_service.reject_post.assert_awaited_once_with(
            db=mock_db,
            post_uuid=post_uuid,
            current_user=current_user,
            payload=payload,
        )
