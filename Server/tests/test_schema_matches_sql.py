"""
Each server model must have exactly the columns its table has after all
migrations in database/migrations/ are applied. Identifiers are folded the way
Postgres folds them: unquoted -> lowercase, quoted -> unchanged.
"""

import pathlib
import re

import pytest

from schema import MODELS, Priority

MIGRATIONS_DIR = pathlib.Path(__file__).resolve().parents[2] / "database" / "migrations"

TABLE_NAME = r'("\w+"|\w+)'
CREATE_TABLE = re.compile(r"CREATE TABLE IF NOT EXISTS " + TABLE_NAME + r"\s*\((.*?)\n\);", re.S)
ALTER_TABLE = re.compile(r"ALTER TABLE " + TABLE_NAME + r"(.*?);", re.S)
DROP_TABLE = re.compile(r"DROP TABLE IF EXISTS " + TABLE_NAME + r"\s*;")
COLUMN_DEF = re.compile(r"^\s*([A-Z][A-Z0-9_]*)\s+", re.M)
ADD_COLUMN = re.compile(r"ADD COLUMN (?:IF NOT EXISTS )?([A-Z][A-Z0-9_]*)")
DROP_COLUMN = re.compile(r"DROP COLUMN (?:IF EXISTS )?([A-Z][A-Z0-9_]*)")
TABLE_CONSTRAINTS = {"UNIQUE", "PRIMARY", "FOREIGN", "CONSTRAINT", "CHECK"}


def _strip_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


def _strip_function_bodies(sql: str) -> str:
    return re.sub(r"\$\$.*?\$\$", "", sql, flags=re.S)


def _fold(identifier: str) -> str:
    if identifier.startswith('"'):
        return identifier.strip('"')
    return identifier.lower()


def _columns(names) -> set:
    return {_fold(c) for c in names}


def schema_after_migrations() -> dict:
    tables = {}
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        sql = _strip_function_bodies(_strip_comments(path.read_text(encoding="utf-8")))
        for name, body in CREATE_TABLE.findall(sql):
            tables[_fold(name)] = _columns(c for c in COLUMN_DEF.findall(body) if c not in TABLE_CONSTRAINTS)
        for name in DROP_TABLE.findall(sql):
            tables.pop(_fold(name), None)
        for name, body in ALTER_TABLE.findall(sql):
            tables[_fold(name)] |= _columns(ADD_COLUMN.findall(body))
            tables[_fold(name)] -= _columns(DROP_COLUMN.findall(body))
    return tables


@pytest.mark.parametrize("model", MODELS, ids=lambda m: m.__name__)
def test_model_matches_table(model):
    tables = schema_after_migrations()
    assert model.db_table() in tables, f"No table {model.TABLE} in migrations"
    assert set(model.columns()) == tables[model.db_table()]


def test_priority_range_matches_database_constraint():
    sql = (MIGRATIONS_DIR / "003_priority_scale.sql").read_text(encoding="utf-8")
    low, high = map(int, re.search(r"ITEM_PRIORITY BETWEEN (\d+) AND (\d+)", sql).groups())
    assert [p.value for p in Priority] == list(range(low, high + 1))
