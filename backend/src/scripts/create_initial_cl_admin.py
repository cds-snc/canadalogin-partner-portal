"""Deprecated module wrapper for the packaged CL Admin roster command."""

from ..app.commands.bootstrap_cl_admin import main, run_bootstrap_command

__all__ = ["main", "run_bootstrap_command"]


if __name__ == "__main__":
    main()
