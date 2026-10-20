from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Household(TableModel):
    """A group of people sharing shopping lists."""

    TABLE = "HOUSEHOLD"
    PREFIX = "HOUS_"
    GENERATED = ("invite_code",)

    name: str
    invite_code: Optional[str] = None
    created_by: Optional[str] = None
    id: Optional[int] = None
    created_at: Optional[str] = None
