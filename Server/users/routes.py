"""
Users Routes
API endpoints for user profile management
"""

from flask import request, jsonify
from users import users_bp


@users_bp.route("/profile", methods=["GET"])
def get_user_profile():
    """
    Get current user profile
    
    Returns:
        User object with profile information
    """
    try:
        # TODO: Get current user from JWT token
        # TODO: Query user profile from database
        # TODO: Return user data
        
        return jsonify({"message": "Get user profile"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
    try:
        data = request.get_json()
        
        # TODO: Get current user from JWT token
        # TODO: Validate input data
        # TODO: Update user profile in database
        # TODO: Return updated user data
        
        return jsonify({"message": "User profile updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    """
    Get user by OHID
    
    Parameters:
        user_id (str): User OHID
    
    Returns:
        User object (public profile info)
    """
    try:
        # TODO: Query user by OHID
        # TODO: Return public user information
        
        return jsonify({"message": f"Get user {user_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
