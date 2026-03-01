"""
Members Models
Domain models for members
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Member:
    """Member domain model"""
    MEMB_ID: str
    MEMB_USER_ID: str
    MEMB_HOUSEHOLD_ID: str
    MEMB_ROLE: str = "MEMBER"  # e.g., "ADMIN", "MEMBER"
    MEMB_JOINED_AT: Optional[datetime] = None
