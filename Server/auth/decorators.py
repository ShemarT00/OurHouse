"""
Authentication decorators
Verify the Supabase access token sent by the client in the Authorization header.
"""

from functools import wraps

from flask import abort, g, request

from supabase_client import get_admin_client


def require_auth(view):
    """Reject the request with 401 unless it carries a valid Supabase access token.

    On success, `g.user` holds the Supabase auth user and `g.token` the raw
    access token (pass it to `get_user_client` so RLS applies).
    """

    @wraps(view)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            abort(401)

        token = auth_header.split(" ", 1)[1]
        try:
            response = get_admin_client().auth.get_user(token)
        except Exception:
            abort(401)

        if not response or not response.user:
            abort(401)

        g.user = response.user
        g.token = token
        return view(*args, **kwargs)

    return wrapper
