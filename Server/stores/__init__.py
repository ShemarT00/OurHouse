"""
Stores Blueprint
Handles a household's stores (where items are bought)
"""

from flask import Blueprint

stores_bp = Blueprint("stores", __name__, url_prefix="/api")

from . import routes  # noqa: E402, F401
