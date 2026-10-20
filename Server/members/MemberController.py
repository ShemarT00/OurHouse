"""
Members Controllers
Business logic for member operations
"""

from typing import Any, Dict, List, Optional

from members.MemberDAO import MemberDAO


class MemberController:
    """Handle member business logic and operations"""

    def __init__(self, dao: Optional[MemberDAO] = None):
        self._dao = dao or MemberDAO()

    def list_members(self, token: str, household_id: int) -> Optional[List[Dict[str, Any]]]:
        """Members of a household, or None if the user cannot see it.

        Every household has at least its creator as a member, so an empty
        result means the household does not exist or the user is not a member.
        """
        members = self._dao.fetch_members(token, household_id)
        if not members:
            return None
        return [member.to_api() for member in members]
