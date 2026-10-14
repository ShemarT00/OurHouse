from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class ShoppingList(TableModel):
    """A named list of items belonging to a household."""

    TABLE = "SHOPPINGLIST"
    PREFIX = "SHOP_"

    name: str
    household_id: int
    id: Optional[int] = None
    created_at: Optional[str] = None
