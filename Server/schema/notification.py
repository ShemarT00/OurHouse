from dataclasses import dataclass
from enum import Enum
from typing import Optional

from .base import TableModel


class ItemEvent(str, Enum):
    """A change a member made to an item. Stored as NOTI_EVENT."""

    ADDED = "added"
    EDITED = "edited"
    BOUGHT = "bought"
    UNBOUGHT = "unbought"
    REMOVED = "removed"


@dataclass
class Notification(TableModel):
    """What one member sees in their inbox about an item event in their household.

    Created only by the item trigger (migration 011). The list and item links
    become null when those rows are deleted; the sentence keeps its wording.
    """

    TABLE = "NOTIFICATION"
    PREFIX = "NOTI_"

    user_id: str  # the recipient
    household_id: int
    event: ItemEvent
    item_name: str
    sentence: str
    list_id: Optional[int] = None
    item_id: Optional[int] = None
    actor_id: Optional[str] = None  # null when no one was signed in, or the actor's account is gone
    read: bool = False
    id: Optional[int] = None
    created_at: Optional[str] = None
