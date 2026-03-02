"""
Users Models
Domain models for users
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class User:
    """User domain model"""
    USER_ID: str
    USER_EMAIL: str
    USER_NAME: str
    USER_PASSWORD_HASH: str
    USER_CREATED_AT: Optional[datetime] = None
    USER_UPDATED_AT: Optional[datetime] = None
