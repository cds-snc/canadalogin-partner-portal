from .api import router
from .core.setup import create_application

app = create_application(router=router, create_tables_on_start=False)