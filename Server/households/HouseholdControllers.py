"""
Households Controllers
Business logic for household operations
"""

from typing import Any, Dict, List, Optional

from .HouseholdDAO import HouseholdDAO

MAX_NAME_LENGTH = 255
MAX_INVITE_CODE_LENGTH = 32


class HouseholdController:
    """Handle household business logic and operations"""

    def __init__(self, dao: Optional[HouseholdDAO] = None):
        self._dao = dao or HouseholdDAO()

    def create_household(self, token: str, name: str) -> Dict[str, Any]:
        """Create a household with the caller as admin. Raises ValueError for an invalid name."""
        name = (name or "").strip()
        if not name or len(name) > MAX_NAME_LENGTH:
            raise ValueError(f"Household name must be 1-{MAX_NAME_LENGTH} characters")
        return self._dao.create_household(token, name).to_api()

    def join_household(self, token: str, invite_code: str) -> Optional[Dict[str, Any]]:
        """Join a household by invite code; None if no household has that code.

        Raises ValueError for a blank or oversized code.
        """
        invite_code = (invite_code or "").strip().upper()
        if not invite_code or len(invite_code) > MAX_INVITE_CODE_LENGTH:
            raise ValueError("Enter the household's invite code")
        household = self._dao.join_household(token, invite_code)
        return None if household is None else household.to_api()

    def list_households(self, token: str) -> List[Dict[str, Any]]:
        """Households the signed-in user is a member of"""
        return [household.to_api() for household in self._dao.fetch_households(token)]

    def get_household(self, token: str, household_id: int) -> Optional[Dict[str, Any]]:
        """One household, or None if it does not exist or the user is not a member"""
        household = self._dao.fetch_household(token, household_id)
        return None if household is None else household.to_api()
