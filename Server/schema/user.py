from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class User(TableModel):
    """A person with an account."""

    TABLE = "USER"
    PREFIX = "USER_"

    name: str
    email: str
    invite_code: str
    id: Optional[int] = None
    created_at: Optional[str] = None
