"""
Shopping Lists Routes
API endpoints for shopping list management
"""

from flask import abort, g, request
from auth.decorators import require_auth
from lists import lists_bp
from lists.ListControllers import ListController

_list_controller = ListController()


@lists_bp.route("/households/<int:household_id>/shopping-lists", methods=["GET"])
@require_auth
def list_shopping_lists(household_id):
    """
    Get all shopping lists for a household
    
    Parameters:
        household_id (int): Household OHID
    
    Returns:
        List of shopping list objects (404 if the household does not exist
        or the user is not a member)
    """
    lists = _list_controller.list_lists(g.token, household_id)
    if lists is None:
        abort(404)
    return lists, 200


@lists_bp.route("/households/<int:household_id>/shopping-lists", methods=["POST"])
@require_auth
def create_shopping_list(household_id):
    """
    Create a new shopping list
    
    Parameters:
        household_id (int): Household OHID
    
    Request body:
        - name (str): Shopping list name
    
    Returns:
        Created shopping list object (404 if the household does not exist
        or the user is not a member)
    """
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    if not isinstance(name, str):
        abort(400, description="name is required")
    try:
        created = _list_controller.create_list(g.token, household_id, name)
    except ValueError as e:
        abort(400, description=str(e))
    if created is None:
        abort(404)
    return created, 201


@lists_bp.route("/households/<int:household_id>/shopping-lists/<int:list_id>", methods=["GET"])
@require_auth
def get_shopping_list(household_id, list_id):
    """
    Get specific shopping list
    
    Parameters:
        household_id (int): Household OHID
        list_id (int): Shopping list OHID
    
    Returns:
        Shopping list object (404 if it does not exist or the user is not a member)
    """
    shopping_list = _list_controller.get_list(g.token, household_id, list_id)
    if shopping_list is None:
        abort(404)
    return shopping_list, 200


@lists_bp.route("/households/<household_id>/shopping-lists/<list_id>", methods=["PUT"])
def update_shopping_list(household_id, list_id):
    """
    Update shopping list
    
    Parameters:
        household_id (str): Household OHID
        list_id (str): Shopping list OHID
    
    Request body:
        - name (str, optional): New list name
    
    Returns:
        Updated shopping list object
    """
    abort(501)


@lists_bp.route("/households/<household_id>/shopping-lists/<list_id>", methods=["DELETE"])
def delete_shopping_list(household_id, list_id):
    """
    Delete shopping list
    
    Parameters:
        household_id (str): Household OHID
        list_id (str): Shopping list OHID
    
    Returns:
        Success message
    """
    abort(501)


@lists_bp.route("/households/<household_id>/shopping-lists/<list_id>/clear-completed", methods=["POST"])
def clear_completed_items(household_id, list_id):
    """
    Clear all completed items from shopping list
    
    Parameters:
        household_id (str): Household OHID
        list_id (str): Shopping list OHID
    
    Returns:
        Updated shopping list
    """
    abort(501)
