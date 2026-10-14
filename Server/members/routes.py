"""
Members Routes
API endpoints for household member management
"""

from flask import abort
from members import members_bp
from auth.decorators import require_auth


@members_bp.route("/households/<household_id>/members", methods=["GET"])
@require_auth
def list_household_members(household_id):
    """
    Get all members of a household
    
    Parameters:
        household_id (str): Household OHID
    
    Returns:
        List of member objects in the household
    """
    abort(501)


@members_bp.route("/households/<household_id>/members/<member_id>", methods=["GET"])
@require_auth
def get_household_member(household_id, member_id):
    """
    Get specific member of a household
    
    Parameters:
        household_id (str): Household OHID
        member_id (str): Member OHID
    
    Returns:
        Member object with user details
    """
    abort(501)


@members_bp.route("/households/<household_id>/members/<member_id>", methods=["DELETE"])
@require_auth
def remove_member(household_id, member_id):
    """
    Remove member from household
    
    Parameters:
        household_id (str): Household OHID
        member_id (str): Member OHID to remove
    
    Returns:
        Success message
    """
    abort(501)
