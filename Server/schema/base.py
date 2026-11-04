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
from typing import Any, ClassVar, Dict, Optional, Tuple, Type, TypeVar, get_args, get_origin

T = TypeVar("T", bound="TableModel")

# Columns the database fills in for every table; omitted from inserts when unset
SERVER_GENERATED = ("id", "created_at")


def api_field_name(field_name: str) -> str:
    """JSON/TypeScript name for a field: id -> OHID, snake_case -> camelCase."""
    if field_name == "id":
        return "OHID"
    head, *rest = field_name.split("_")
    return head + "".join(part.capitalize() for part in rest)


def _enum_type(field_type: Any) -> Optional[Type[Enum]]:
    return field_type if isinstance(field_type, type) and issubclass(field_type, Enum) else None


def _enum_list_type(field_type: Any) -> Optional[Type[Enum]]:
    """The enum of a List[SomeEnum] field, else None."""
    if get_origin(field_type) is not list:
        return None
    return _enum_type(get_args(field_type)[0])


def _plain(value: Any) -> Any:
    """An enum, or a list of enums, as the value stored and sent as JSON."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list):
        return [_plain(v) for v in value]
    return value


# Tables created with a quoted name in the migrations (reserved words)
QUOTED_TABLES = ("USER",)


class TableModel:
    TABLE: ClassVar[str]
    PREFIX: ClassVar[str]
    # Extra columns this table's database fills in (defaults, functions)
    GENERATED: ClassVar[Tuple[str, ...]] = ()

    @classmethod
    def generated_fields(cls) -> Tuple[str, ...]:
        """Fields the database always fills in, so every row read has them."""
        return SERVER_GENERATED + cls.GENERATED

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
            enum, enum_list = _enum_type(f.type), _enum_list_type(f.type)
            if enum and value is not None:
                value = enum(value)
            elif enum_list:
                value = [enum_list(v) for v in value or []]
            values[f.name] = value
        return cls(**values)

    def to_row(self) -> Dict[str, Any]:
        """Column-keyed dict for inserts/updates; unset server-generated columns are left out."""
        row = {}
        for f in fields(self):
            value = getattr(self, f.name)
            if value is None and f.name in self.generated_fields():
                continue
            row[self.column(f.name)] = _plain(value)
        return row

    def to_api(self) -> Dict[str, Any]:
        """JSON body for the client, shaped like the generated TypeScript interface."""
        body = {}
        for f in fields(self):
            body[api_field_name(f.name)] = _plain(getattr(self, f.name))
        return body
