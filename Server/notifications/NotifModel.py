"""
Notifications Models
Domain models for notifications
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Notification:
    """Notification domain model"""
    NOTIF_ID: str
    NOTIF_MEMBER_ID: str
    NOTIF_MESSAGE: str
    NOTIF_TYPE: str  # e.g., "ITEM_ADDED", "ITEM_UPDATED"
    NOTIF_READ: bool = False
    NOTIF_CREATED_AT: Optional[datetime] = None
