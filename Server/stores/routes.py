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
STORE = STORES + "/<int:store_id>"


def _json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        abort(400, description="Request body must be a JSON object")
    return body


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
        - retailerKey (str, optional): the retailer the store is linked to
        - website (str, optional): the store's own website; https:// is added
          if no scheme is given. At most one of retailerKey and website.

    Returns:
        Created store object
    """
    body = _json_body()
    try:
        created = _store_controller.create_store(g.token, household_id, body)
    except ValueError as e:
        abort(400, description=str(e))
    if created is None:
        abort(404)
    return created, 201


@stores_bp.route(STORE, methods=["PATCH"])
@require_auth
def update_store(household_id, store_id):
    """
    Edit a store's name and/or link; any member of the household may

    Parameters:
        household_id (int): Household OHID
        store_id (int): Store OHID

    Request body (all optional, at least one):
        - name (str)
        - retailerKey (str or null), website (str or null): the store's link.
          Sending either replaces the whole link, so the other is cleared.

    Returns:
        Updated store object
    """
    body = _json_body()
    try:
        updated = _store_controller.update_store(g.token, household_id, store_id, body)
    except ValueError as e:
        abort(400, description=str(e))
    if updated is None:
        abort(404)
    return updated, 200
