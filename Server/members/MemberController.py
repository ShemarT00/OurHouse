"""
Members Controllers
Business logic for member operations
"""

from typing import List, Optional, Dict, Any

from members.MemberDAO import MemberDAO


class MemberController:
    """Handle member business logic and operations"""
    
    def __init__(self):
        pass
    
    def get_members(self, household_id: str) -> List[Dict[str, Any]]:
        """Fetch all members in a household"""

        # Use the DAO to fetch members for the household
        # members = self.dao.fetch_members(household_id)
        
        member_dao = MemberDAO()
        members = member_dao.fetch_members(household_id)

        return members
    
    def get_member(self, member_id: str) -> Optional[Dict[str, Any]]:
        
        if not member_id:
            return None
        
        # Use the DAO to fetch the member
        # member = self.dao.fetch_member(member_id)
        # return member 
        
        member_dao = MemberDAO()
        member = member_dao.fetch_member(member_id)

        pass
    

    def is_admin(self, user_id: str, household_id: str) -> bool:
        """Check if a user is an admin in a specific household"""
        member_dao = MemberDAO()
        return member_dao.check_Admin(user_id, household_id)

    def create_member(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new member"""
        pass
    
    def update_member(self, member_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update member information"""
        pass
    
    def delete_member(self, member_id: str) -> bool:
        """Remove a member from a household"""
        pass
    
    def is_admin(self, user_id: str, household_id: str) -> bool:
        """Check if a user is an admin in a specific household"""
        member_dao = MemberDAO()
        return member_dao.check_Admin(user_id, household_id)
    
