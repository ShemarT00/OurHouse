"""
Users DAO (Data Access Object)
Database operations for users
"""

from typing import List, Optional, Dict, Any
from supabase_client import get_admin_client
from flask import abort


class UserDAO:
    """Handle database operations for users"""

    def __init__(self):
        pass

    def fetch_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Query a specific user"""
        pass

    def fetch_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Query a user by email address"""
        pass

    def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new user row into the USER table and return it."""
        response = (
            get_admin_client().table("USER")
            .insert({
                "USER_ID": data["USER_ID"],
                "USER_EMAIL": data["USER_EMAIL"],
                "USER_NAME": data["USER_NAME"],
            })
            .execute()
        )

        if not response.data:
            abort(500)

        return response.data[0]
    
    def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a user record"""
        pass
    
    def delete_user(self, user_id: str) -> bool:
        """Delete a user"""
        pass
    
    def search_users(self, query: str) -> List[Dict[str, Any]]:
        """Search users by email or name"""
        pass
