"""
Members Routes
API endpoints for household member management
"""

from flask import abort, g, request
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


@members_bp.route("/households/<int:household_id>/muted", methods=["PUT"])
@require_auth
def set_household_muted(household_id):
    """
    Mute or unmute the caller's own membership of a household. A muted member
    gets no notifications from the household; nothing missed is delivered later.

    Parameters:
        household_id (int): Household OHID

    Request body:
        - muted (bool): true to mute, false to unmute

    Returns:
        {"householdId": int, "muted": bool}
        (404 if the household does not exist or the user is not a member)
    """
    body = request.get_json(silent=True)
    muted = body.get("muted") if isinstance(body, dict) else None
    if not isinstance(muted, bool):
        abort(400, description="muted must be true or false")
    result = _member_controller.set_muted(g.token, household_id, muted)
    if result is None:
        abort(404)
    return result, 200


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
