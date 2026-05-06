#!/usr/bin/env python3
"""
FastAPI Boilerplate Setup Script

Automates copying the correct configuration files for different deployment scenarios.
"""

import shutil
import subprocess
import sys
from pathlib import Path

DEPLOYMENTS = {
    "local": {
        "name": "Local development with Uvicorn",
        "description": "Auto-reload enabled, development-friendly",
        "path": "scripts/local_with_uvicorn",
    },
    "local_without_docker": {
        "name": "Local development without Docker",
        "description": "Use a local Python virtualenv and local Postgres/Redis services",
        "path": "scripts/local_without_docker",
        "no_docker": True,
    },
    "staging": {
        "name": "Staging with Gunicorn managing Uvicorn workers",
        "description": "Production-like setup for testing",
        "path": "scripts/gunicorn_managing_uvicorn_workers",
    },
    "production": {
        "name": "Production with NGINX",
        "description": "Full production setup with reverse proxy",
        "path": "scripts/production_with_nginx",
    },
}


def show_help():
    """Display help information"""
    print("FastAPI Boilerplate Setup")
    print("=" * 25)
    print()
    print("Usage: python setup.py <deployment-type>")
    print()
    print("Available deployment types:")
    for key, config in DEPLOYMENTS.items():
        print(f"  {key:12} - {config['name']}")
        print(f"  {' ' * 12}   {config['description']}")
        print()
    print("Examples:")
    print("  python setup.py local       # Set up for local development")
    print("  python setup.py staging     # Set up for staging environment")
    print("  python setup.py production  # Set up for production deployment")
    print()
    print("Local non-Docker workflow:")
    print("  cd backend && uv sync --group dev --extra dev")
    print("  uv run uvicorn src.app.main:app --reload")
    print()
    print("New option:")
    print("  local_without_docker - sets up a .venv and copies only env files; expects local Postgres and Redis")


def copy_files(deployment_type: str):
    """Copy configuration files for the specified deployment type"""
    if deployment_type not in DEPLOYMENTS:
        print(f"❌ Unknown deployment type: {deployment_type}")
        print()
        show_help()
        return False

    config = DEPLOYMENTS[deployment_type]
    source_path = Path(config["path"])

    if not source_path.exists():
        print(f"❌ Configuration path not found: {source_path}")
        return False

    print(f"🚀 Setting up {config['name']}...")
    print(f"   {config['description']}")
    print()

    # Choose which files to copy. For no-docker deployments, only copy the env example.
    if config.get("no_docker"):
        files_to_copy = [
            (".env.example", "src/.env"),
        ]
    else:
        files_to_copy = [
            ("Dockerfile", "Dockerfile"),
            ("docker-compose.yml", "docker-compose.yml"),
            (".env.example", "src/.env"),
        ]

    success = True
    for source_file, dest_file in files_to_copy:
        source = source_path / source_file
        dest = Path(dest_file)

        if not source.exists():
            print(f"⚠️  Warning: {source} not found, skipping...")
            continue

        try:
            dest.parent.mkdir(parents=True, exist_ok=True)

            shutil.copy2(source, dest)
            print(f"✅ Copied {source} → {dest}")

        except Exception as e:
            print(f"❌ Failed to copy {source} → {dest}: {e}")
            success = False

    if success:
        print()
        print("🎉 Setup complete!")
        print()

        if deployment_type in ["staging", "production"]:
            print("⚠️  IMPORTANT: Update the .env file with your production values:")
            print("   - Generate a new SECRET_KEY: openssl rand -hex 32")
            print("   - Change all passwords and sensitive values")
            print()

        print("Next steps:")
        if not config.get("no_docker"):
            print("   docker compose up")

        if deployment_type in ["local", "local_without_docker"]:
            print("   open http://127.0.0.1:8000/docs")
            print()
            print("Non-Docker local development:")
            print("   uv sync --group dev --extra dev")
            print("   uv run uvicorn src.app.main:app --reload")
            print("   Use .vscode/launch.json to debug the backend from VS Code")

        # If this is the local_without_docker option, try to create a virtualenv
        if config.get("no_docker"):
            print()
            print("🔧 local_without_docker: ensuring a Python virtual environment exists (.venv)")
            try:
                create_virtualenv()
            except Exception as e:
                print(f"⚠️  Virtualenv creation failed: {e}")
        elif deployment_type == "production":
            print("   open http://localhost")

        return True

    return False


def interactive_setup():
    """Interactive setup when no arguments provided"""
    print("FastAPI Boilerplate Setup")
    print("=" * 25)
    print()
    print("Choose your deployment type:")
    print()

    options = list(DEPLOYMENTS.keys())
    for i, key in enumerate(options, 1):
        config = DEPLOYMENTS[key]
        print(f"  {i}. {config['name']}")
        print(f"     {config['description']}")
        print()

    while True:
        try:
            choice = input(f"Enter your choice (1-{len(options)}): ").strip()

            if choice.isdigit():
                choice_num = int(choice)
                if 1 <= choice_num <= len(options):
                    return options[choice_num - 1]

            if choice.lower() in DEPLOYMENTS:
                return choice.lower()

            print(f"❌ Invalid choice. Please enter 1-{len(options)} or the deployment name.")

        except KeyboardInterrupt:
            print("\n\n👋 Setup cancelled.")
            return None
        except EOFError:
            print("\n\n👋 Setup cancelled.")
            return None


def create_virtualenv():
    """Create a local .venv using the current Python interpreter.

    Requires Python >= 3.11 (3.12 recommended). If the running interpreter is older,
    this function will warn but still attempt to create the venv.
    """
    min_version = (3, 11)
    current = sys.version_info
    if current < min_version:
        print(
            f"⚠️  Current Python is {current.major}.{current.minor}; >={min_version[0]}.{min_version[1]} is recommended (3.12 ideal)."
        )

    venv_dir = Path(".venv")
    if venv_dir.exists():
        print(f"✅ .venv already exists at {venv_dir.resolve()}")
        return True

    print(f"Creating virtual environment at {venv_dir} using {sys.executable}...")
    try:
        res = subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=False)
        if res.returncode != 0:
            raise RuntimeError(f"venv command returned {res.returncode}")

        print("✅ .venv created")
        activate_cmd = "source .venv/bin/activate"
        print("Next: activate the venv and install dependencies:")
        print(f"   {activate_cmd}")
        print("   pip install -r requirements.txt  # or use your preferred tool")
        print("Ensure PostgreSQL and Redis are running on the local machine.")
        return True
    except Exception as exc:
        print(f"❌ Failed to create virtualenv: {exc}")
        return False


def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] in ["-h", "--help", "help"]:
        show_help()
        return

    if len(sys.argv) == 2:
        deployment_type = sys.argv[1].lower()
    elif len(sys.argv) == 1:
        deployment_type = interactive_setup()
        if deployment_type is None:
            return
    else:
        show_help()
        return

    success = copy_files(deployment_type)

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
