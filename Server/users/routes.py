"""
Users Routes
API endpoints for user profile management
"""

from flask import abort, g, request
from auth.decorators import require_auth
from users import users_bp
from users.UserController import UserController

_user_controller = UserController()


@users_bp.route("/profile", methods=["GET"])
@require_auth
def get_user_profile():
    """
    Get current user profile
    
    Returns:
        User object with profile information
    """
    user = _user_controller.get_current_user(g.token, g.user.id)
    if user is None:
        abort(404)
    return user, 200


@users_bp.route("/profile", methods=["PUT"])
@require_auth
def update_user_profile():
    """
    Change the signed-in user's name

    Request body:
        - name (str): New name, 1-255 characters once trimmed.
          Other fields (e.g. email) are ignored.

    Returns:
        Updated user object, the same shape as GET /profile
    """
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        abort(400, description="Request body must be a JSON object")
    try:
        user = _user_controller.update_name(g.token, g.user.id, body.get("name"))
    except ValueError as e:
        abort(400, description=str(e))
    if user is None:
        abort(404)
    return user, 200


@users_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    """
    Get user by OHID
    
    Parameters:
        user_id (str): User OHID
    
    Returns:
        User object (public profile info)
    """
    abort(501)
