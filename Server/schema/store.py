from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Store(TableModel):
    """A place a household buys things; an item can name one."""

    TABLE = "STORE"
    PREFIX = "STOR_"

    name: str
    household_id: int
    id: Optional[int] = None
    created_at: Optional[str] = None
