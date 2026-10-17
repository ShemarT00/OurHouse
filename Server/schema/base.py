"""
Base class for domain models that mirror a database table.

Each model sets `TABLE` and `PREFIX` as written in the migrations; every
dataclass field maps to the column `PREFIX + FIELD.upper()` (e.g. Item.list_id
-> ITEM_LIST_ID). These models are the single source of truth: client types are
generated from them (scripts/gen_client_types.py) and tests check them against
the migrations.

Postgres folds unquoted identifiers to lowercase, so the migrations' ITEM_LIST_ID
is really the column item_list_id, and only quoted tables ("USER") keep their
case. `db_table()` and `column()` return those real names, which is what
Supabase expects in queries and returns in rows.
"""

from dataclasses import fields
from enum import Enum
from typing import Any, ClassVar, Dict, Tuple, Type, TypeVar

T = TypeVar("T", bound="TableModel")

# Columns the database fills in; omitted from inserts when unset
SERVER_GENERATED = ("id", "created_at")


# Tables created with a quoted name in the migrations (reserved words)
QUOTED_TABLES = ("USER",)


class TableModel:
    TABLE: ClassVar[str]
    PREFIX: ClassVar[str]

    @classmethod
    def db_table(cls) -> str:
        """Table name as stored by Postgres (and used by Supabase queries)."""
        return cls.TABLE if cls.TABLE in QUOTED_TABLES else cls.TABLE.lower()

    @classmethod
    def column(cls, field_name: str) -> str:
        """Database column for a field name, as stored by Postgres."""
        return (cls.PREFIX + field_name).lower()

    @classmethod
    def columns(cls) -> Tuple[str, ...]:
        return tuple(cls.column(f.name) for f in fields(cls))

    @classmethod
    def from_row(cls: Type[T], row: Dict[str, Any]) -> T:
        """Build a model from a Supabase row keyed by column name."""
        values = {}
        for f in fields(cls):
            value = row.get(cls.column(f.name))
            if isinstance(f.type, type) and issubclass(f.type, Enum) and value is not None:
                value = f.type(value)
            values[f.name] = value
        return cls(**values)

    def to_row(self) -> Dict[str, Any]:
        """Column-keyed dict for inserts/updates; unset server-generated columns are left out."""
        row = {}
        for f in fields(self):
            value = getattr(self, f.name)
            if value is None and f.name in SERVER_GENERATED:
                continue
            if isinstance(value, Enum):
                value = value.value
            row[self.column(f.name)] = value
        return row
