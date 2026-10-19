"""
Each server model must have exactly the columns its table has after all
migrations in database/migrations/ are applied.
"""

import pathlib
import re

import pytest

from schema import MODELS, Priority

MIGRATIONS_DIR = pathlib.Path(__file__).resolve().parents[2] / "database" / "migrations"

CREATE_TABLE = re.compile(r'CREATE TABLE IF NOT EXISTS "?(\w+)"?\s*\((.*?)\n\);', re.S)
ALTER_TABLE = re.compile(r'ALTER TABLE "?(\w+)"?(.*?);', re.S)
DROP_TABLE = re.compile(r'DROP TABLE IF EXISTS "?(\w+)"?\s*;')
COLUMN_DEF = re.compile(r"^\s*([A-Z][A-Z0-9_]*)\s+", re.M)
ADD_COLUMN = re.compile(r"ADD COLUMN (?:IF NOT EXISTS )?([A-Z][A-Z0-9_]*)")
DROP_COLUMN = re.compile(r"DROP COLUMN (?:IF EXISTS )?([A-Z][A-Z0-9_]*)")
TABLE_CONSTRAINTS = {"UNIQUE", "PRIMARY", "FOREIGN", "CONSTRAINT", "CHECK"}


def _strip_comments(sql: str) -> str:
    return re.sub(r"--[^\n]*", "", sql)


def schema_after_migrations() -> dict:
    tables = {}
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        sql = _strip_comments(path.read_text(encoding="utf-8"))
        for name, body in CREATE_TABLE.findall(sql):
            tables[name] = {c for c in COLUMN_DEF.findall(body) if c not in TABLE_CONSTRAINTS}
        for name in DROP_TABLE.findall(sql):
            tables.pop(name, None)
        for name, body in ALTER_TABLE.findall(sql):
            tables[name] |= set(ADD_COLUMN.findall(body))
            tables[name] -= set(DROP_COLUMN.findall(body))
    return tables


@pytest.mark.parametrize("model", MODELS, ids=lambda m: m.__name__)
def test_model_matches_table(model):
    tables = schema_after_migrations()
    assert model.TABLE in tables, f"No table {model.TABLE} in migrations"
    assert set(model.columns()) == tables[model.TABLE]


def test_priority_range_matches_database_constraint():
    sql = (MIGRATIONS_DIR / "003_priority_scale.sql").read_text(encoding="utf-8")
    low, high = map(int, re.search(r"ITEM_PRIORITY BETWEEN (\d+) AND (\d+)", sql).groups())
    assert [p.value for p in Priority] == list(range(low, high + 1))
