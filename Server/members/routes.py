"""
Members Routes
API endpoints for household member management
"""

from flask import abort, g
from members import members_bp
from members.MemberController import MemberController
from auth.decorators import require_auth

_member_controller = MemberController()


@members_bp.route("/households/<int:household_id>/members", methods=["GET"])
@require_auth
def list_household_members(household_id):
    """
    Get all members of a household
    
    Parameters:
        household_id (int): Household OHID
    
    Returns:
        List of member objects (404 if the household does not exist or the user is not a member)
    """
    members = _member_controller.list_members(g.token, household_id)
    if members is None:
        abort(404)
    return members, 200


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
