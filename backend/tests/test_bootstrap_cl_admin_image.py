from pathlib import Path


def test_backend_image_includes_packaged_cl_admin_bootstrap_command() -> None:
    dockerfile = (Path(__file__).resolve().parents[1] / "Dockerfile").read_text(encoding="utf-8")

    assert "COPY ./src/app /code/app" in dockerfile
    assert (Path(__file__).resolve().parents[1] / "src/app/commands/bootstrap_cl_admin.py").is_file()
    assert "src.scripts.create_initial_cl_admin" not in dockerfile
