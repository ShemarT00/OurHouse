from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Store(TableModel):
    """A place a household buys things; an item can name one.

    Linked to a retailer, or with its own website, or neither (never both).
    """

    TABLE = "STORE"
    PREFIX = "STOR_"

    name: str
    household_id: int
    id: Optional[int] = None
    created_at: Optional[str] = None
    retailer_key: Optional[str] = None
    website: Optional[str] = None
