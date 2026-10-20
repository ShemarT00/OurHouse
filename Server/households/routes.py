"""
Households Routes
API endpoints for household management
"""

from flask import abort, g, request
from auth.decorators import require_auth
from households import households_bp
from households.HouseholdControllers import HouseholdController

_household_controller = HouseholdController()


@households_bp.route("", methods=["GET"])
@require_auth
def list_households():
    """
    Get all households for the current user
    
    Returns:
        List of household objects the user is a member of
    """
    return _household_controller.list_households(g.token), 200


@households_bp.route("", methods=["POST"])
@require_auth
def create_household():
    """
    Create a new household; the caller becomes its admin member
    
    Request body:
        - name (str): Household name
    
    Returns:
        Created household object, including its invite code
    """
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    if not isinstance(name, str):
        abort(400, description="name is required")
    try:
        household = _household_controller.create_household(g.token, name)
    except ValueError as e:
        abort(400, description=str(e))
    return household, 201


@households_bp.route("/join", methods=["POST"])
@require_auth
def join_household():
    """
    Join a household using its invite code; the caller becomes a member
    
    Request body:
        - code (str): Household invite code (any case)
    
    Returns:
        The joined household (200, also when already a member);
        404 if no household has that code
    """
    body = request.get_json(silent=True) or {}
    code = body.get("code")
    if not isinstance(code, str):
        abort(400, description="code is required")
    try:
        household = _household_controller.join_household(g.token, code)
    except ValueError as e:
        abort(400, description=str(e))
    if household is None:
        abort(404, description="No household has that invite code")
    return household, 200


@households_bp.route("/<int:household_id>", methods=["GET"])
@require_auth
def get_household(household_id):
    """
    Get specific household by OHID
    
    Parameters:
        household_id (int): Household OHID
    
    Returns:
        Household object (404 if it does not exist or the user is not a member)
    """
    household = _household_controller.get_household(g.token, household_id)
    if household is None:
        abort(404)
    return household, 200


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
