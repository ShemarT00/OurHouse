"""
Authentication helpers
Sign-up, login and sessions are handled by Supabase Auth on the client; the
"USER" profile row is created by a database trigger (migration 004). The server
only verifies access tokens, via `auth.decorators.require_auth`.
"""
