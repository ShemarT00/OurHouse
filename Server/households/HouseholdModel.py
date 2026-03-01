"""
Households Models
Domain models for households
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Household:
    """Household domain model"""
    HOUS_ID: str
    HOUS_NAME: str
    HOUS_CREATED_BY: str
    HOUS_CREATED_AT: Optional[datetime] = None
    HOUS_UPDATED_AT: Optional[datetime] = None
