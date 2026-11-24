"""
Token login for editors who sign in through a React admin instead of Django's login page.

    POST auth/login   {username, password} -> {token, expiresIn, user}
    GET  auth/me      -> {user}  (401 when the request may not edit)

The token is a signed, expiring value (django.core.signing), so nothing is stored in the
database. It stops working when it expires or when the user's password changes. Send it as
``Authorization: Bearer <token>``. A request that carries a valid token needs no CSRF
token, because it does not rely on cookies.

A project with its own login (JWT, SSO…) sets AUTHENTICATE to a function that returns the user
for a request, read from the Authorization header. That user is then treated like a token user.
"""

import hashlib

from django.contrib.auth import get_user_model
from django.core import signing
from django.core.cache import cache

from .conf import get_authenticate, get_setting

SALT = "visual_cms.token"


def _fingerprint(user) -> str:
    # Changes whenever the password changes, which invalidates tokens issued before.
    return hashlib.sha256(f"{user.pk}:{user.password}".encode()).hexdigest()[:20]


def issue_token(user) -> str:
    return signing.dumps({"u": user.pk, "f": _fingerprint(user)}, salt=SALT)


def _user_from_token(value: str):
    try:
        data = signing.loads(value, salt=SALT, max_age=get_setting("TOKEN_MAX_AGE"))
        pk, fingerprint = data["u"], data["f"]
    except (signing.BadSignature, KeyError, TypeError):
        return None
    user = get_user_model()._default_manager.filter(pk=pk).first()
    if user is None or not user.is_active or fingerprint != _fingerprint(user):
        return None
    return user


def _user_from_project_auth(request):
    """The user returned by the project's AUTHENTICATE function, or None."""
    authenticate = get_authenticate()
    if authenticate is None:
        return None
    try:
        result = authenticate(request)
    except Exception:
        return None
    # Django REST framework authenticators return (user, token).
    user = result[0] if isinstance(result, tuple) and result else result
    if user is None or not getattr(user, "is_authenticated", False) or not getattr(user, "is_active", False):
        return None
    return user


def attach_token_user(request):
    """
    If the request carries a valid Bearer token, make its user ``request.user`` (so every
    AUTHORIZE function and ``updated_by`` see the editor) and return it. Otherwise return None
    and leave ``request.user`` alone.

    The token is either this package's own token (POST auth/login) or, when the AUTHENTICATE
    setting is set, the project's own (for example a JWT from its login API). AUTHENTICATE is
    asked only when the request has an Authorization header, so a session cookie can never
    pass as a token and skip the CSRF check.
    """
    if hasattr(request, "_cms_token_user"):
        return request._cms_token_user
    user = None
    header = request.META.get("HTTP_AUTHORIZATION", "")
    scheme, _, value = header.partition(" ")
    if scheme.lower() == "bearer" and value.strip():
        user = _user_from_token(value.strip())
    if user is None and header.strip():
        user = _user_from_project_auth(request)
    request._cms_token_user = user
    if user is not None:
        request.user = user
    return user


# ------------------------------------------------------------------ brute-force protection

def _attempt_key(request, username: str) -> str:
    who = f"{request.META.get('REMOTE_ADDR', '')}|{username.strip().lower()}"
    return "visual_cms:login:" + hashlib.sha256(who.encode()).hexdigest()


def is_locked_out(request, username: str) -> bool:
    return cache.get(_attempt_key(request, username), 0) >= get_setting("LOGIN_MAX_ATTEMPTS")


def record_failure(request, username: str) -> None:
    key = _attempt_key(request, username)
    timeout = get_setting("LOGIN_LOCKOUT_SECONDS")
    if cache.add(key, 1, timeout):
        return
    try:
        cache.incr(key)
    except ValueError:  # expired between add and incr
        cache.add(key, 1, timeout)


def clear_failures(request, username: str) -> None:
    cache.delete(_attempt_key(request, username))
