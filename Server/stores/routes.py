"""
Stores Routes
API endpoints for a household's stores.
All routes 404 when the household does not exist or the user is not a member.
"""

from flask import abort, g, request
from auth.decorators import require_auth
from stores import stores_bp
from stores.StoreControllers import StoreController

_store_controller = StoreController()

STORES = "/households/<int:household_id>/stores"


@stores_bp.route(STORES, methods=["GET"])
@require_auth
def list_stores(household_id):
    """
    Get a household's stores, by name

    Parameters:
        household_id (int): Household OHID

    Returns:
        List of store objects
    """
    stores = _store_controller.list_stores(g.token, household_id)
    if stores is None:
        abort(404)
    return stores, 200


@stores_bp.route(STORES, methods=["POST"])
@require_auth
def create_store(household_id):
    """
    Add a store to a household

    Parameters:
        household_id (int): Household OHID

    Request body:
        - name (str): Store name, unique within the household

    Returns:
        Created store object
    """
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    if not isinstance(name, str):
        abort(400, description="name is required")
    try:
        created = _store_controller.create_store(g.token, household_id, name)
    except ValueError as e:
        abort(400, description=str(e))
    if created is None:
        abort(404)
    return created, 201
