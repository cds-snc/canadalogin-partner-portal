from fastapi import APIRouter

from .policies import router as policies_router
from .posts import router as posts_router
from .workspaces import router as workspaces_router

router = APIRouter(prefix="/v1")
router.include_router(policies_router)
router.include_router(posts_router)
router.include_router(workspaces_router)