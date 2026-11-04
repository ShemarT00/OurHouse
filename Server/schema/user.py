from dataclasses import dataclass, field
from typing import List, Optional

from .base import TableModel
from .notification import ItemEvent


@dataclass
class User(TableModel):
    """A person with an account. USER_ID is their Supabase auth user ID (UUID)."""

    TABLE = "USER"
    PREFIX = "USER_"

    name: str
    email: str
    # Kinds of item event the account is not notified about, in any household (ADR 0004)
    switched_off_events: List[ItemEvent] = field(default_factory=list)
    id: Optional[str] = None
    created_at: Optional[str] = None
