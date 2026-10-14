from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Household(TableModel):
    """A group of people sharing shopping lists."""

    TABLE = "HOUSEHOLD"
    PREFIX = "HOUS_"

    name: str
    id: Optional[int] = None
    created_at: Optional[str] = None
