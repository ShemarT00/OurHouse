"""
Shopping Lists Blueprint
Handles shopping list operations
"""

from flask import Blueprint

lists_bp = Blueprint("lists", __name__, url_prefix="/api")

from . import routes  # noqa: E402, F401
