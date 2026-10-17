from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class User(TableModel):
    """A person with an account. USER_ID is their Supabase auth user ID (UUID)."""

    TABLE = "USER"
    PREFIX = "USER_"

    name: str
    email: str
    id: Optional[str] = None
    created_at: Optional[str] = None
