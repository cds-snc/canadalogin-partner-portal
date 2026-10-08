from fastapi import APIRouter
from starlette.responses import Response

router = APIRouter(tags=["csrf"])


@router.get("/csrf", include_in_schema=False)
async def csrf_bootstrap() -> Response:
    return Response(status_code=204, headers={"Cache-Control": "no-store"})
