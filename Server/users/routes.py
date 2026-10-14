"""
Users Routes
API endpoints for user profile management
"""

from flask import abort
from users import users_bp


@users_bp.route("/profile", methods=["GET"])
def get_user_profile():
    """
    Get current user profile
    
    Returns:
        User object with profile information
    """
    abort(501)


@users_bp.route("/profile", methods=["PUT"])
def update_user_profile():
    """
    Update current user profile
    
    Request body:
        - firstName (str, optional): User's first name
        - lastName (str, optional): User's last name
        - email (str, optional): User's email
    
    Returns:
        Updated user object
    """
    abort(501)


@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    """
    Get user by OHID
    
    Parameters:
        user_id (str): User OHID
    
    Returns:
        User object (public profile info)
    """
    abort(501)
