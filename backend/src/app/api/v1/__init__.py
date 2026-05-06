from fastapi import APIRouter

from .departments import router as departments_router
from .health import router as health_router
from .ibm_sv_admin import router as ibm_sv_admin_router
from .logout import router as logout_router
from .oidc import router as oidc_router
from .policies import router as policies_router
from .rate_limits import router as rate_limits_router
from .roles import router as roles_router
from .tasks import router as tasks_router
from .tiers import router as tiers_router
from .users import router as users_router
from .workspaces import router as workspaces_router

router = APIRouter(prefix="/v1")
router.include_router(departments_router)
router.include_router(health_router)
router.include_router(ibm_sv_admin_router)
router.include_router(oidc_router)
router.include_router(logout_router)
router.include_router(policies_router)
router.include_router(users_router)
router.include_router(roles_router)
router.include_router(tasks_router)
router.include_router(tiers_router)
router.include_router(rate_limits_router)
router.include_router(workspaces_router)
