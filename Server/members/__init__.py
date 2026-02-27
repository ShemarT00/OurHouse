"""
Members Blueprint
Handles all member and household membership operations
"""

from flask import Blueprint

members_bp = Blueprint("members", __name__, url_prefix="/api")

from . import routes  # noqa: E402, F401
