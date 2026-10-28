"""
Stores Controllers
Business logic for a household's stores
"""

from typing import Any, Dict, List, Optional

from households.HouseholdDAO import HouseholdDAO
from schema import Store

from .StoreDAO import StoreDAO

MAX_NAME_LENGTH = 255


class StoreController:
    """Handle store business logic and operations"""

    def __init__(self, dao: Optional[StoreDAO] = None, household_dao: Optional[HouseholdDAO] = None):
        self._dao = dao or StoreDAO()
        self._household_dao = household_dao or HouseholdDAO()

    def _can_see_household(self, token: str, household_id: int) -> bool:
        # RLS hides households the user is not a member of
        return self._household_dao.fetch_household(token, household_id) is not None

    def list_stores(self, token: str, household_id: int) -> Optional[List[Dict[str, Any]]]:
        """A household's stores, or None if the household does not exist or the user is not a member."""
        if not self._can_see_household(token, household_id):
            return None
        return [store.to_api() for store in self._dao.fetch_stores(token, household_id)]

    def create_store(self, token: str, household_id: int, name: str) -> Optional[Dict[str, Any]]:
        """Add a named store to a household; None if the user is not a member.

        Raises ValueError for an invalid or duplicate name.
        """
        name = (name or "").strip()
        if not name or len(name) > MAX_NAME_LENGTH:
            raise ValueError(f"Store name must be 1-{MAX_NAME_LENGTH} characters")
        if not self._can_see_household(token, household_id):
            return None
        return self._dao.create_store(token, Store(name=name, household_id=household_id)).to_api()
