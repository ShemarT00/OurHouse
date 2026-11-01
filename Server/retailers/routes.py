"""
Retailers Routes
API endpoints for the retailers a store can be linked to.
"""

from flask import g
from auth.decorators import require_auth
from retailers import retailers_bp
from retailers.RetailerControllers import RetailerController

_retailer_controller = RetailerController()


@retailers_bp.route("", methods=["GET"])
@require_auth
def list_retailers():
    """
    Get the retailers a store can be linked to, by name (retired ones left out)

    Returns:
        List of retailer objects
    """
    return _retailer_controller.list_retailers(g.token), 200
