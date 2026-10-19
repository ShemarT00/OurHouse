from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Member(TableModel):
    """Joins a User to a Household."""

    TABLE = "MEMBER"
    PREFIX = "MEMB_"

    user_id: int
    household_id: int
    first_name: str
    last_name: str
    is_admin: bool = False
    id: Optional[int] = None
    created_at: Optional[str] = None

    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
