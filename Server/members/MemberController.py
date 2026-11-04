"""
Members Controllers
Business logic for member operations
"""

from typing import Any, Dict, List, Optional

from members.MemberDAO import MemberDAO


def _without_muted(body: Dict[str, Any]) -> Dict[str, Any]:
    body.pop("muted", None)
    return body


class MemberController:
    """Handle member business logic and operations"""

    def __init__(self, dao: Optional[MemberDAO] = None):
        self._dao = dao or MemberDAO()

    def list_members(self, token: str, household_id: int) -> Optional[List[Dict[str, Any]]]:
        """Members of a household, or None if the user cannot see it.

        Every household has at least its creator as a member, so an empty
        result means the household does not exist or the user is not a member.
        Whether a member has muted the household is theirs alone, so it is left out.
        """
        members = self._dao.fetch_members(token, household_id)
        if not members:
            return None
        return [_without_muted(member.to_api()) for member in members]

    def set_muted(self, token: str, household_id: int, muted: bool) -> Optional[Dict[str, Any]]:
        """Mute or unmute the caller's membership; None if they are not a member."""
        result = self._dao.set_muted(token, household_id, muted)
        if result is None:
            return None
        return {"householdId": household_id, "muted": result}
