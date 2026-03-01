"""
Items Models
Domain models for shopping list items
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Item:
    """Shopping list item domain model"""
    ITEM_ID: str
    ITEM_LIST_ID: str
    ITEM_NAME: str
    ITEM_PRIORITY: str = "MEDIUM"  # LOW, MEDIUM, HIGH
    ITEM_STORE_ID: Optional[str] = None
    ITEM_IS_PURCHASED: bool = False
    ITEM_CREATED_AT: Optional[datetime] = None
    ITEM_UPDATED_AT: Optional[datetime] = None
