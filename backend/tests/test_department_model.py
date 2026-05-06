from src.app.models.department import Department as DepartmentModel
from src.app.schemas.department import Department as DepartmentSchema


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

	def test_department_schema_exposes_standard_metadata_fields(self) -> None:
		required_fields = {
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

		assert required_fields.issubset(DepartmentSchema.model_fields.keys())
