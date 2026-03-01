"""
Lists Models
Domain models for shopping lists
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class ShoppingList:
    """Shopping list domain model"""
    SHOP_ID: str
    SHOP_HOUSEHOLD_ID: str
    SHOP_NAME: str
    SHOP_CREATED_BY: str
    SHOP_IS_ACTIVE: bool = True
    SHOP_CREATED_AT: Optional[datetime] = None
    SHOP_UPDATED_AT: Optional[datetime] = None
