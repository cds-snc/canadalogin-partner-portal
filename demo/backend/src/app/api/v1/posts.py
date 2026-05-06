import uuid as uuid_pkg
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request
from fastcrud import PaginatedListResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.dependencies import get_current_superuser, get_current_user, get_post_service
from ...core.access_control import casbin_guard
from ...core.db.database import async_get_db
from ...core.utils.cache import cache
from ...schemas.post import PostApprove, PostCreate, PostRead, PostReject, PostUpdate
from ...services.post_service import PostService

router = APIRouter(tags=["posts"])


@router.post("/user/{user_uuid}/post", response_model=PostRead, status_code=201)
@cache("{user_uuid}_posts", resource_id_name="user_uuid", pattern_to_invalidate_extra=["{user_uuid}_posts:*"])
async def write_post(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    post: PostCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, Any]:
    return await service.create_post(db=db, user_uuid=user_uuid, current_user=current_user, post=post)


@router.get("/user/{user_uuid}/posts", response_model=PaginatedListResponse[PostRead])
@cache(
    key_prefix="{user_uuid}_posts:page_{page}:items_per_page:{items_per_page}",
    resource_id_name="user_uuid",
    expiration=60,
)
async def read_posts(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict:
    return await service.list_posts_by_user_uuid(db=db, user_uuid=user_uuid, page=page, items_per_page=items_per_page)


@router.get("/user/{user_uuid}/post/{post_uuid}", response_model=PostRead)
@cache(key_prefix="{user_uuid}_post_cache", resource_id_name="post_uuid")
async def read_post(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    post_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, Any]:
    return await service.get_post_by_user_uuid(db=db, user_uuid=user_uuid, post_uuid=post_uuid)


@router.patch("/user/{user_uuid}/post/{post_uuid}")
@cache("{user_uuid}_post_cache", resource_id_name="post_uuid", pattern_to_invalidate_extra=["{user_uuid}_posts:*"])
async def patch_post(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    post_uuid: uuid_pkg.UUID,
    values: PostUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, str]:
    return await service.update_post(
        db=db,
        user_uuid=user_uuid,
        post_uuid=post_uuid,
        current_user=current_user,
        values=values,
    )


@router.delete("/user/{user_uuid}/post/{post_uuid}")
@cache("{user_uuid}_post_cache", resource_id_name="post_uuid", pattern_to_invalidate_extra=["{user_uuid}_posts:*"])
async def erase_post(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    post_uuid: uuid_pkg.UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, str]:
    return await service.delete_post(db=db, user_uuid=user_uuid, post_uuid=post_uuid, current_user=current_user)


@router.delete("/user/{user_uuid}/db_post/{post_uuid}", dependencies=[Depends(get_current_superuser)])
@cache("{user_uuid}_post_cache", resource_id_name="post_uuid", pattern_to_invalidate_extra=["{user_uuid}_posts:*"])
async def erase_db_post(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    post_uuid: uuid_pkg.UUID,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, str]:
    return await service.delete_post_from_db(db=db, user_uuid=user_uuid, post_uuid=post_uuid)


@router.post("/user/{user_uuid}/post/{post_uuid}/submit-review")
@cache("{user_uuid}_post_cache", resource_id_name="post_uuid", pattern_to_invalidate_extra=["{user_uuid}_posts:*"])
async def submit_post_for_review(
    request: Request,
    user_uuid: uuid_pkg.UUID,
    post_uuid: uuid_pkg.UUID,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, str]:
    return await service.submit_for_review(
        db=db,
        user_uuid=user_uuid,
        post_uuid=post_uuid,
        current_user=current_user,
    )


@router.post("/posts/{post_uuid}/approve")
@casbin_guard.require_permission("posts", "approve")
async def approve_post(
    request: Request,
    post_uuid: uuid_pkg.UUID,
    payload: PostApprove,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, str]:
    return await service.approve_post(db=db, post_uuid=post_uuid, current_user=current_user, payload=payload)


@router.post("/posts/{post_uuid}/reject")
@casbin_guard.require_permission("posts", "reject")
async def reject_post(
    request: Request,
    post_uuid: uuid_pkg.UUID,
    payload: PostReject,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
) -> dict[str, str]:
    return await service.reject_post(db=db, post_uuid=post_uuid, current_user=current_user, payload=payload)


@router.get("/posts/pending-review", response_model=PaginatedListResponse[PostRead])
@casbin_guard.require_permission("posts", "approve")
async def read_posts_pending_review(
    request: Request,
    db: Annotated[AsyncSession, Depends(async_get_db)],
    service: Annotated[PostService, Depends(get_post_service)],
    page: int = 1,
    items_per_page: int = 10,
) -> dict[str, Any]:
    return await service.list_posts_pending_review(db=db, page=page, items_per_page=items_per_page)
