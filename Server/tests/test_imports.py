"""
Every server module must import cleanly, without Supabase credentials.
"""

import importlib
import pathlib

import pytest

SERVER_DIR = pathlib.Path(__file__).resolve().parent.parent
SKIP_DIRS = {"venv", "tests", "__pycache__"}


def _server_modules():
    for path in sorted(SERVER_DIR.rglob("*.py")):
        relative = path.relative_to(SERVER_DIR)
        if SKIP_DIRS.intersection(relative.parts):
            continue
        parts = relative.with_suffix("").parts
        if parts[-1] == "__init__":
            parts = parts[:-1]
        if parts:
            yield ".".join(parts)


@pytest.mark.parametrize("module", list(_server_modules()))
def test_module_imports(module, monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_KEY", raising=False)
    importlib.import_module(module)
