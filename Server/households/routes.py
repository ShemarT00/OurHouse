"""
Households Routes
API endpoints for household management
"""

from flask import abort
from households import households_bp


@households_bp.route("", methods=["GET"])
def list_households():
    """
    Get all households for the current user
    
    Returns:
        List of household objects the user is a member of
    """
    abort(501)


@households_bp.route("", methods=["POST"])
def create_household():
    """
    Create a new household
    
    Request body:
        - name (str): Household name
    
    Returns:
        Created household object
    """
    abort(501)


@households_bp.route("/<household_id>", methods=["GET"])
def get_household(household_id):
    """
    Get specific household by OHID
    
    Parameters:
        household_id (str): Household OHID
    
    Returns:
        Household object with members list
    """
    abort(501)


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
    abort(501)


@households_bp.route("/<household_id>", methods=["DELETE"])
def delete_household(household_id):
    """
    Delete household
    
    Parameters:
        household_id (str): Household OHID
    
    Returns:
        Success message
    """
    abort(501)
