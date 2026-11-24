"""
Settings, read from the STORIO_EDITOR dict in your Django settings (the older name VISUAL_CMS also works):

    STORIO_EDITOR = {
        "AUTHORIZE": "myproject.cms.can_edit",   # who may edit (default: staff users)
        "AUTHENTICATE": "myproject.cms.jwt_user", # your own Bearer token -> user (default: none)
        "ALLOWED_PAGES": ["home", "pricing"],    # restrict page keys (default: any valid key)
        "MAX_BODY_BYTES": 1_048_576,             # largest JSON body for a save
        "MAX_UPLOAD_BYTES": 5_242_880,           # largest uploaded image
        "UPLOAD_DIR": "cms-uploads",             # folder inside your media storage, or a
                                                 # function(request) -> folder (one per tenant)
        "ALLOW_SVG": False,                      # SVG can carry scripts; off by default
        "TOKEN_LOGIN": True,                     # enable POST auth/login (editors sign in from a React admin)
        "TOKEN_MAX_AGE": 43_200,                 # seconds a login token stays valid (12 hours)
        "LOGIN_MAX_ATTEMPTS": 5,                 # wrong passwords per username+IP before a lockout
        "LOGIN_LOCKOUT_SECONDS": 300,            # how long that lockout lasts
        "COLLECTIONS": {...},                    # models editable on [slug] pages (see collection_views.py)
    }
"""

import re
from functools import lru_cache
from typing import Any, Callable

from django.conf import settings
from django.utils.module_loading import import_string

DEFAULTS: dict[str, Any] = {
    "AUTHORIZE": "storio_elements_editor.permissions.is_staff_user",
    "AUTHENTICATE": None,
    "ALLOWED_PAGES": None,
    "MAX_BODY_BYTES": 1024 * 1024,
    "MAX_UPLOAD_BYTES": 5 * 1024 * 1024,
    "UPLOAD_DIR": "cms-uploads",
    "ALLOW_SVG": False,
    "TOKEN_LOGIN": True,
    "TOKEN_MAX_AGE": 12 * 60 * 60,
    "LOGIN_MAX_ATTEMPTS": 5,
    "LOGIN_LOCKOUT_SECONDS": 300,
    "COLLECTIONS": {},
}


def get_setting(name: str) -> Any:
    # VISUAL_CMS is the name used before the rename and is still read.
    user_settings = getattr(settings, "STORIO_EDITOR", None) or getattr(settings, "VISUAL_CMS", None) or {}
    return user_settings.get(name, DEFAULTS[name])


@lru_cache(maxsize=None)
def _import(path: str) -> Callable:
    return import_string(path)


def get_authorize() -> Callable:
    value = get_setting("AUTHORIZE")
    return _import(value) if isinstance(value, str) else value


def get_authenticate() -> Callable | None:
    """The project's own token check (AUTHENTICATE), or None when it is not set."""
    value = get_setting("AUTHENTICATE")
    if not value:
        return None
    return _import(value) if isinstance(value, str) else value


_UPLOAD_SEGMENT = re.compile(r"^[A-Za-z0-9_.-]{1,100}$")


def get_upload_dir(request) -> str:
    """
    The folder for uploads. UPLOAD_DIR is a folder name, or a function that receives the request
    and returns one (for example a folder per tenant). The result must be a relative path of safe
    segments: no "..", no absolute path. Anything else raises ValueError.
    """
    value = get_setting("UPLOAD_DIR")
    folder = value(request) if callable(value) else value
    if not isinstance(folder, str):
        raise ValueError("UPLOAD_DIR must be a string or return one.")
    segments = folder.strip().strip("/").split("/")
    if not folder.strip().strip("/") or any(seg in ("", ".", "..") or not _UPLOAD_SEGMENT.match(seg) for seg in segments):
        raise ValueError(f"Invalid UPLOAD_DIR: {folder!r}")
    return "/".join(segments)
