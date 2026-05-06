from src.app.core.department_seed import load_department_seed_rows


class TestDepartmentSeed:
	def test_load_department_seed_rows_maps_the_catalog_subset(self) -> None:
		rows = load_department_seed_rows()

		assert len(rows) == 93
		assert rows[0] == {
			"abbreviation": "AAFC",
			"abbreviation_fr": "AAC",
			"gc_org_id": 2222,
			"lead_department_name": "Agriculture and Agri-Food Canada",
			"lead_department_name_fr": "Agriculture et Agroalimentaire Canada",
			"name": "Agriculture and Agri-Food Canada",
			"name_fr": "Agriculture et Agroalimentaire Canada",
		}

	def test_load_department_seed_rows_skips_rows_without_abbreviations(self) -> None:
		rows = load_department_seed_rows()

		assert all(row["abbreviation"] is not None for row in rows)
		assert rows[-1] == {
			"abbreviation": "TB",
			"abbreviation_fr": "CT",
			"gc_org_id": 3704,
			"lead_department_name": None,
			"lead_department_name_fr": None,
			"name": "Treasury Board",
			"name_fr": "Conseil du Trésor",
		}
