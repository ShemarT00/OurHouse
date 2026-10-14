from dataclasses import dataclass
from typing import Optional

from .base import TableModel


@dataclass
class Notification(TableModel):
    """A message sent to a user about activity in their household."""

    TABLE = "NOTIFICATION"
    PREFIX = "NOTI_"

    user_id: int
    type: str
    message: str
    type_desc: Optional[str] = None
    read: bool = False
    id: Optional[int] = None
    created_at: Optional[str] = None
