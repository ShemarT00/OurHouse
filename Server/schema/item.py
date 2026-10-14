from dataclasses import dataclass
from enum import IntEnum
from typing import Optional

from .base import TableModel


class Priority(IntEnum):
    """How urgently an item is needed. Stored as ITEM_PRIORITY (0-3)."""

    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3


@dataclass
class Item(TableModel):
    """Something a household needs, on one shopping list."""

    TABLE = "ITEM"
    PREFIX = "ITEM_"

    name: str
    list_id: int
    priority: Priority = Priority.NONE
    store_id: Optional[int] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None
    bought: bool = False
    id: Optional[int] = None
    created_at: Optional[str] = None
