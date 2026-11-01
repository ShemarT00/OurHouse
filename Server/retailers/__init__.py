"""
Retailers Blueprint
Handles the retailers a store can be linked to (the same for every household)
"""

from flask import Blueprint

retailers_bp = Blueprint("retailers", __name__, url_prefix="/api/retailers")

from . import routes  # noqa: E402, F401
