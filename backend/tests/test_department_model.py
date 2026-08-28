from src.app.models.department import Department as DepartmentModel


class TestDepartmentModel:
    def test_department_includes_standard_lifecycle_columns(self) -> None:
        required_columns = {
            "uuid",
            "created_at",
            "updated_at",
            "deleted_at",
            "is_deleted",
            "gc_org_id",
            "name_fr",
            "abbreviation",
            "abbreviation_fr",
            "lead_department_name",
            "lead_department_name_fr",
        }

        assert required_columns.issubset(DepartmentModel.__table__.columns.keys())
