"""
Items Routes
API endpoints for shopping list item management.
All routes 404 when the list is not in the household or the user is not a member.
"""

from flask import abort, g, request
from auth.decorators import require_auth
from items import items_bp
from items.ItemControllers import ItemController

_item_controller = ItemController()

ITEMS = "/households/<int:household_id>/shopping-lists/<int:list_id>/items"
ITEM = ITEMS + "/<int:item_id>"


def _json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        abort(400, description="Request body must be a JSON object")
    return body


@items_bp.route(ITEMS, methods=["GET"])
@require_auth
def list_items(household_id, list_id):
    """
    Get all items in a shopping list (still-needed first, then most urgent)

    Returns:
        List of item objects
    """
    items = _item_controller.list_items(g.token, household_id, list_id)
    if items is None:
        abort(404)
    return items, 200


@items_bp.route(ITEM, methods=["GET"])
@require_auth
def get_item(household_id, list_id, item_id):
    """
    Get a specific item

    Returns:
        Item object
    """
    item = _item_controller.get_item(g.token, household_id, list_id, item_id)
    if item is None:
        abort(404)
    return item, 200


@items_bp.route(ITEMS, methods=["POST"])
@require_auth
def create_item(household_id, list_id):
    """
    Add a new item to a shopping list

    Request body:
        - name (str): Item name
        - priority (int, optional): 0 none, 1 low, 2 medium, 3 high (default 0)
        - quantity (int, optional): 1-9999
        - notes (str, optional)

    Returns:
        Created item object
    """
    body = _json_body()
    try:
        item = _item_controller.create_item(g.token, household_id, list_id, body)
    except ValueError as e:
        abort(400, description=str(e))
    if item is None:
        abort(404)
    return item, 201


@items_bp.route(ITEM, methods=["PUT"])
@require_auth
def update_item(household_id, list_id, item_id):
    """
    Update an item; send only the fields to change

    Request body (all optional):
        - name (str), priority (int 0-3), quantity (int or null),
          notes (str or null), bought (bool)

    Returns:
        Updated item object
    """
    body = _json_body()
    try:
        item = _item_controller.update_item(g.token, household_id, list_id, item_id, body)
    except ValueError as e:
        abort(400, description=str(e))
    if item is None:
        abort(404)
    return item, 200


@items_bp.route(ITEM + "/toggle", methods=["PUT"])
@require_auth
def toggle_item_bought(household_id, list_id, item_id):
    """
    Flip an item between needed and bought

    Returns:
        Updated item object
    """
    item = _item_controller.toggle_bought(g.token, household_id, list_id, item_id)
    if item is None:
        abort(404)
    return item, 200


@items_bp.route(ITEM, methods=["DELETE"])
@require_auth
def delete_item(household_id, list_id, item_id):
    """
    Delete an item from a shopping list

    Returns:
        204 No Content
    """
    if not _item_controller.delete_item(g.token, household_id, list_id, item_id):
        abort(404)
    return "", 204
