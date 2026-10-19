from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Store(TableModel):
    """Optional place an item can be bought."""

    TABLE = "STORE"
    PREFIX = "STOR_"

    name: str
    id: Optional[int] = None
    created_at: Optional[str] = None
