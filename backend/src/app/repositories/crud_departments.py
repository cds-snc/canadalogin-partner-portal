from fastcrud import FastCRUD

from ..models.department import Department
from ..schemas.department import (
    DepartmentCreateInternal,
    DepartmentDelete,
    DepartmentRead,
    DepartmentUpdate,
    DepartmentUpdateInternal,
)

CRUDDepartment = FastCRUD[
    Department,
    DepartmentCreateInternal,
    DepartmentUpdate,
    DepartmentUpdateInternal,
    DepartmentDelete,
    DepartmentRead,
]
crud_departments = CRUDDepartment(Department)
