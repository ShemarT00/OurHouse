"""
Households Routes
API endpoints for household management
"""

from flask import request, jsonify
from households import households_bp


@households_bp.route("", methods=["GET"])
def list_households():
    """
    Get all households for the current user
    
    Returns:
        List of household objects the user is a member of
    """
    try:
        # TODO: Get current user from JWT token
        # TODO: Query households where user is a member
        # TODO: Return list of households
        return jsonify({"message": "List households"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@households_bp.route("", methods=["POST"])
def create_household():
    """
    Create a new household
    
    Request body:
        - name (str): Household name
    
    Returns:
        Created household object
    """
    try:
        data = request.get_json()
        
        if not data or "name" not in data:
            return jsonify({"error": "Missing required field: name"}), 400
        
        # TODO: Validate household name
        # TODO: Create new household in database
        # TODO: Add current user as admin member
        # TODO: Return created household
        
        return jsonify({"message": "Create household"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@households_bp.route("/<household_id>", methods=["GET"])
def get_household(household_id):
    """
    Get specific household by OHID
    
    Parameters:
        household_id (str): Household OHID
    
    Returns:
        Household object with members list
    """
    try:
        # TODO: Verify user is member of this household
        # TODO: Query household by OHID
        # TODO: Include list of members
        # TODO: Return household data
        
        return jsonify({"message": f"Get household {household_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@households_bp.route("/<household_id>", methods=["PUT"])
def update_household(household_id):
    """
    Update household information
    
    Parameters:
        household_id (str): Household OHID
    
    Request body:
        - name (str, optional): New household name
    
    Returns:
        Updated household object
    """
    try:
        data = request.get_json()
        
        # TODO: Verify user is admin of this household
        # TODO: Update household fields
        # TODO: Return updated household
        
        return jsonify({"message": f"Update household {household_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@households_bp.route("/<household_id>", methods=["DELETE"])
def delete_household(household_id):
    """
    Delete household
    
    Parameters:
        household_id (str): Household OHID
    
    Returns:
        Success message
    """
    try:
        # TODO: Verify user is admin of this household
        # TODO: Delete household and all related data
        # TODO: Delete all members, lists, items
        
        return jsonify({"message": f"Household {household_id} deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
