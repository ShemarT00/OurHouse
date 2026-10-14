from flask import request, abort
from supabase_client import get_admin_client
from users.UserController import UserController

from . import auth_bp

_user_controller = UserController()


@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Create a user profile after Supabase auth signup."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        abort(401)

    token = auth_header.split(" ", 1)[1]

    # Verify the Supabase JWT and retrieve the authenticated user's ID
    user_response = get_admin_client().auth.get_user(token)
    if not user_response or not user_response.user:
        abort(401)

    supabase_uid = user_response.user.id

    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip()
    first_name = body.get("firstName", "").strip()
    last_name = body.get("lastName", "").strip()

    if not email or not first_name or not last_name:
        abort(400)

    user = _user_controller.create_user({
        "USER_ID": supabase_uid,
        "USER_EMAIL": email,
        "USER_NAME": f"{first_name} {last_name}",
    })

    return {
        "OHID": user["USER_ID"],
        "email": user["USER_EMAIL"],
        "firstName": first_name,
        "lastName": last_name,
    }, 201
