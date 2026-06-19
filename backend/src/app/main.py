from .api import router
from .core.config import settings
from .core.setup import create_application

app = create_application(
    router=router,
    settings=settings,
    create_tables_on_start=False,
    start_arq_service_on_start=settings.START_ARQ_ON_STARTUP,
)
