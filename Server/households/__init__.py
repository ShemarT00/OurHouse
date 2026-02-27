"""
Households Blueprint
Handles all household-related operations
"""

from flask import Blueprint

households_bp = Blueprint("households", __name__, url_prefix="/api/households")

from . import routes  # noqa: E402, F401
