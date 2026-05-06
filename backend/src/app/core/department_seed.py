import csv
from pathlib import Path
from typing import TypedDict


class DepartmentSeedRow(TypedDict):
    abbreviation: str | None
    abbreviation_fr: str | None
    gc_org_id: int | None
    lead_department_name: str | None
    lead_department_name_fr: str | None
    name: str | None
    name_fr: str | None


DEPARTMENT_SEED_FILE = Path(__file__).resolve().parents[1] / "data" / "gc_org_info.csv"


def _normalize_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    return cleaned or None


def _parse_gc_org_id(value: str | None) -> int | None:
    cleaned = _normalize_text(value)
    if cleaned is None or not cleaned.isdigit():
        return None
    return int(cleaned)


def load_department_seed_rows() -> list[DepartmentSeedRow]:
    with DEPARTMENT_SEED_FILE.open(newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        return [
            {
                "abbreviation": abbreviation,
                "abbreviation_fr": _normalize_text(row.get("abreviation")),
                "gc_org_id": _parse_gc_org_id(row.get("gc_orgID")),
                "lead_department_name": _normalize_text(row.get("lead_department")),
                "lead_department_name_fr": _normalize_text(row.get("ministère_responsable")),
                "name": (_normalize_text(row.get("harmonized_name")) or _normalize_text(row.get("legal_title")) or "Unknown department"),
                "name_fr": _normalize_text(row.get("nom_harmonisé")) or _normalize_text(row.get("appellation_légale")),
            }
            for row in reader
            if (abbreviation := _normalize_text(row.get("abbreviation"))) is not None
        ]
