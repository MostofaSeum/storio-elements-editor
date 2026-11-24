"""
REST API used by @brainicon/storio-elements-editor (restAdapter / djangoAdapter):

    GET    records?page=&drafts=1      -> SectionRecord[]
    GET    records/<page>/<section>    -> SectionRecord, or null when never edited
    PUT    records/<page>/<section>    body {content, isPublished} -> SectionRecord
    DELETE records/<page>/<section>    -> 204 (reset to default)
    GET    media                       -> MediaItem[]
    POST   media                       multipart "files" -> {items: MediaItem[]}
    GET    csrf                        -> {csrfToken} (and sets the CSRF cookie)
    POST   auth/login                  body {username, password} -> {token, expiresIn, user}
    GET    auth/me                     -> {user}, or 401 when the request may not edit
    GET    collections/<key>/items     -> [{id, label}]  (see collection_views.py)
    GET    collections/<key>/items/<id> and PUT with {values}

Editors are recognised by a staff session cookie or by ``Authorization: Bearer <token>`` (this
package's token, or the project's own when the AUTHENTICATE setting is set).
"""

import json
import os
import re
import uuid

from django.contrib.auth import authenticate
from django.core.exceptions import RequestDataTooBig
from django.core.files.storage import default_storage
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import CsrfViewMiddleware, get_token
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

from .auth import attach_token_user, clear_failures, is_locked_out, issue_token, record_failure
from .conf import get_authorize, get_setting, get_upload_dir
from .models import CmsRecord

KEY_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,100}$")
RASTER_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


# --------------------------------------------------------------------------- helpers

def _error(status: int, detail: str) -> JsonResponse:
    return JsonResponse({"detail": detail}, status=status)


def _json(data, status: int = 200) -> JsonResponse:
    response = JsonResponse(data, status=status, safe=False)
    response["Cache-Control"] = "no-store"
    return response


def _is_editor(request) -> bool:
    attach_token_user(request)  # a valid Bearer token becomes request.user
    try:
        return bool(get_authorize()(request))
    except Exception:
        return False


def _wants_drafts(request) -> bool:
    """Drafts are returned only when asked for and only to editors."""
    return request.GET.get("drafts") == "1" and _is_editor(request)


def _check_keys(page: str, section: str | None = None) -> JsonResponse | None:
    if not KEY_PATTERN.match(page) or (section is not None and not KEY_PATTERN.match(section)):
        return _error(400, "Invalid page or section key.")
    allowed = get_setting("ALLOWED_PAGES")
    if allowed is not None and page not in allowed:
        return _error(404, f"Unknown page '{page}'.")
    return None


def _csrf_failure(request) -> HttpResponse | None:
    """
    Run Django's CSRF check for an unsafe request. The views are csrf_exempt so
    errors come back as JSON instead of Django's HTML 403 page.
    """
    check = CsrfViewMiddleware(lambda req: None)
    check.process_request(request)
    rejected = check.process_view(request, None, (), {})
    if rejected is not None:
        return _error(403, "CSRF check failed. Send the X-CSRFToken header (see GET csrf).")
    return None


def _guard_write(request) -> JsonResponse | None:
    # CSRF protects requests that rely on cookies. A request with a valid Bearer token
    # does not, so only cookie-based requests need the CSRF token.
    if attach_token_user(request) is None:
        failure = _csrf_failure(request)
        if failure is not None:
            return failure
    if not _is_editor(request):
        return _error(401, "Not authorised.")
    return None


def _allowed_extensions() -> set[str]:
    return RASTER_EXTENSIONS | ({".svg"} if get_setting("ALLOW_SVG") else set())


def _absolute(request, url: str) -> str:
    # The frontend usually runs on another origin, so relative media URLs would break there.
    return request.build_absolute_uri(url) if url.startswith("/") else url


# --------------------------------------------------------------------------- views

@csrf_exempt
def records(request):
    if request.method != "GET":
        return _error(405, "Method not allowed.")

    qs = CmsRecord.objects.select_related("updated_by")
    page = request.GET.get("page")
    if page:
        bad = _check_keys(page)
        if bad:
            return bad
        qs = qs.filter(page=page)
    allowed = get_setting("ALLOWED_PAGES")
    if allowed is not None:
        qs = qs.filter(page__in=allowed)
    if not _wants_drafts(request):
        qs = qs.filter(is_published=True)
    return _json([r.to_dict() for r in qs])


@csrf_exempt
def record(request, page: str, section: str):
    bad = _check_keys(page, section)
    if bad:
        return bad
    qs = CmsRecord.objects.select_related("updated_by").filter(page=page, section_key=section)

    if request.method == "GET":
        if not _wants_drafts(request):
            qs = qs.filter(is_published=True)
        found = qs.first()
        # null (not 404) for a section that was never edited: it is a normal state.
        return _json(found.to_dict() if found else None)

    if request.method == "PUT":
        denied = _guard_write(request)
        if denied:
            return denied
        try:
            raw = request.body
        except RequestDataTooBig:
            return _error(413, "Content too large.")
        if len(raw) > get_setting("MAX_BODY_BYTES"):
            return _error(413, "Content too large.")
        try:
            body = json.loads(raw or b"{}")
        except ValueError:
            return _error(400, "Body must be JSON.")
        if not isinstance(body, dict) or body.get("content") is None:
            return _error(400, "Field 'content' is required.")

        user = request.user if getattr(request, "user", None) and request.user.is_authenticated else None
        saved, _ = CmsRecord.objects.update_or_create(
            page=page,
            section_key=section,
            defaults={
                "content": body["content"],
                "is_published": body.get("isPublished") is not False,
                "updated_by": user,
            },
        )
        return _json(saved.to_dict())

    if request.method == "DELETE":
        denied = _guard_write(request)
        if denied:
            return denied
        qs.delete()
        return HttpResponse(status=204)

    return _error(405, "Method not allowed.")


@csrf_exempt
def media(request):
    if request.method == "GET":
        if not _is_editor(request):
            return _error(401, "Not authorised.")
        try:
            upload_dir = get_upload_dir(request)
        except ValueError:
            return _error(500, "The upload folder setting (UPLOAD_DIR) is invalid.")
        try:
            _dirs, files = default_storage.listdir(upload_dir)
        except (FileNotFoundError, NotImplementedError, OSError):
            return _json([])
        allowed = _allowed_extensions()
        items = [
            {"url": _absolute(request, default_storage.url(f"{upload_dir}/{name}")), "name": name}
            for name in sorted(files)
            if os.path.splitext(name)[1].lower() in allowed
        ]
        return _json(items)

    if request.method == "POST":
        denied = _guard_write(request)
        if denied:
            return denied
        try:
            files = request.FILES.getlist("files") or request.FILES.getlist("file")
        except RequestDataTooBig:
            return _error(413, "Upload too large.")
        if not files:
            return _error(400, "No files uploaded.")

        allowed = _allowed_extensions()
        max_bytes = get_setting("MAX_UPLOAD_BYTES")
        try:
            upload_dir = get_upload_dir(request)
        except ValueError:
            return _error(500, "The upload folder setting (UPLOAD_DIR) is invalid.")
        items = []
        for upload in files:
            ext = os.path.splitext(upload.name)[1].lower()
            if ext not in allowed or upload.size > max_bytes:
                continue
            # Never trust the client's file name for the path: keep only safe characters.
            base = re.sub(r"[^A-Za-z0-9_-]+", "_", os.path.splitext(os.path.basename(upload.name))[0])[:60] or "image"
            stored = default_storage.save(f"{upload_dir}/{uuid.uuid4().hex[:8]}_{base}{ext}", upload)
            items.append({
                "url": _absolute(request, default_storage.url(stored)),
                "name": upload.name,
                "size": upload.size,
            })

        if not items:
            kinds = ", ".join(sorted(e.lstrip(".").upper() for e in allowed))
            return _error(400, f"No valid images. Allowed types: {kinds}, up to {max_bytes // (1024 * 1024)} MB.")
        return _json({"items": items}, status=201)

    return _error(405, "Method not allowed.")


@ensure_csrf_cookie
def csrf(request):
    """Return a CSRF token for frontends on another domain, which cannot read Django's cookie."""
    if request.method != "GET":
        return _error(405, "Method not allowed.")
    return _json({"csrfToken": get_token(request)})


def _user_info(user) -> dict:
    if not user or not getattr(user, "is_authenticated", False):
        return {"username": "", "name": ""}
    return {"username": user.get_username(), "name": user.get_full_name() or user.get_username()}


@csrf_exempt
def auth_login(request):
    """Exchange a staff username and password for a signed token (see auth.py)."""
    if not get_setting("TOKEN_LOGIN"):
        return _error(404, "Token login is disabled.")
    if request.method != "POST":
        return _error(405, "Method not allowed.")
    try:
        raw = request.body
        if len(raw) > 4096:
            return _error(413, "Request too large.")
        body = json.loads(raw or b"{}")
    except (ValueError, RequestDataTooBig):
        return _error(400, "Body must be JSON.")
    username, password = (body.get("username") if isinstance(body, dict) else None), (body.get("password") if isinstance(body, dict) else None)
    if not isinstance(username, str) or not isinstance(password, str) or not username or not password:
        return _error(400, "Send a username and a password.")

    if is_locked_out(request, username):
        response = _error(429, "Too many failed attempts. Try again in a few minutes.")
        response["Retry-After"] = str(get_setting("LOGIN_LOCKOUT_SECONDS"))
        return response

    user = authenticate(request, username=username, password=password)
    if user is None or not user.is_active:
        record_failure(request, username)
        return _error(401, "Invalid username or password.")

    request.user = user
    if not _is_editor(request):
        return _error(403, "This account is not allowed to edit the site.")

    clear_failures(request, username)
    return _json({"token": issue_token(user), "expiresIn": get_setting("TOKEN_MAX_AGE"), "user": _user_info(user)})


@csrf_exempt
def auth_me(request):
    """Is the current request (session or token) allowed to edit?"""
    if request.method != "GET":
        return _error(405, "Method not allowed.")
    if not _is_editor(request):
        return _error(401, "Not authorised.")
    return _json({"user": _user_info(getattr(request, "user", None))})
