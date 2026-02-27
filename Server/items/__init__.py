"""
Items Blueprint
Handles all shopping list item operations
"""

from flask import Blueprint

items_bp = Blueprint("items", __name__, url_prefix="/api")

from . import routes  # noqa: E402, F401
