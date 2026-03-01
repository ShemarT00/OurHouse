"""
Member DAO (Data Access Object)
Database operations for members
"""

# refer to database schema for MEMBER table structure and fields

from typing import List, Optional, Dict, Any



class MemberDAO:
    """Handle database operations for members"""
    
    def __init__(self):
        pass
    
    def fetch_members(self, household_id: str) -> List[Dict[str, Any]]:
        
        query = "SELECT * FROM MEMBER WHERE household_id = %s"
        
        result = self.db.execute(query, (household_id,))
        
        return result.fetchall()
    
    def fetch_member(self, member_id: str) -> Optional[Dict[str, Any]]:
        
        query = "SELECT * FROM MEMBER WHERE member_id = %s"
        
        result = self.db.execute(query, (member_id,))
        
        return result.fetchone()
    
    def check_Admin(self, user_id: str, household_id: str) -> bool:
        
        query = "SELECT MEMB_IS_ADMIN FROM MEMBER WHERE user_id = %s AND household_id = %s"
        
        result = self.db.execute(query, (user_id, household_id))
        
        member = result.fetchone()
        
        if member and member['MEMB_IS_ADMIN'] == 1:
            return True
        return False
    
    def create_member(self, data: Dict[str, Any]) -> Dict[str, Any]:
        
        query = """INSERT INTO MEMBER (user_id, household_id, role) VALUES (%s, %s, %s) RETURNING member_id, user_id, household_id, role"""
        
        values = (data['user_id'], data['household_id'], data['role'])

        result = self.db.execute(query, values)
        return result.fetchone()
    
    def update_member(self, member_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        
        query = """UPDATE MEMBER SET role = %s WHERE member_id = %s RETURNING member_id, user_id, household_id, role"""

        values = (data['role'], member_id)
        result = self.db.execute(query, values)
        return result.fetchone()
    
    def delete_member(self, member_id: str) -> bool:
        """Delete a member record"""
        pass
    
    def fetch_member_by_user_household(self, user_id: str, household_id: str) -> Optional[Dict[str, Any]]:
        """Find a member by user and household"""
        pass
