from fastapi import APIRouter

from .departments import router as departments_router
from .health import router as health_router
from .logout import router as logout_router
from .oidc import router as oidc_router
from .onboarding_oversight import router as onboarding_oversight_router
from .role_assignments import router as role_assignments_router
from .roles import router as roles_router
from .rp_application_developer_invitations import router as rp_application_developer_invitations_router
from .rp_applications import router as rp_applications_router
from .tasks import router as tasks_router
from .users import router as users_router
from .workspaces import router as workspaces_router

router = APIRouter(prefix="/v1")
router.include_router(departments_router)
router.include_router(health_router)
router.include_router(onboarding_oversight_router)
router.include_router(oidc_router)
router.include_router(logout_router)
router.include_router(rp_application_developer_invitations_router)
router.include_router(users_router)
router.include_router(role_assignments_router)
router.include_router(roles_router)
router.include_router(rp_applications_router)
router.include_router(tasks_router)
router.include_router(workspaces_router)
