# django-storio-elements-editor

Django backend for [`@brainicon/storio-elements-editor`](../README.md) (the main README has the full install guide, including the React side and the `npx storio-editor init --backend django` shortcut). It stores the content editors change in Storio Elements Editor and serves the REST API the CMS talks to.

Use it when your site's frontend is React or Next.js and your backend is Django. Django keeps the content in its own database and decides who may edit, through your existing Django logins.

```
React / Next.js site  ──  @brainicon/storio-elements-editor  (CMS screen, live preview, pencil buttons)
        │  djangoAdapter (fetch + sign-in token)
        ▼
Django  ──  django-storio-elements-editor  (API + CmsRecord table + Django admin)
```

Supports Django 4.2, 5.x and 6.x (tested on 4.2, 5.2 and 6.0).

## Install

**Fastest:** from your Next.js project, `npx storio-editor init --django-dir <folder with manage.py>` installs this package and does all the setup below for you (settings, urls, CORS, migration). See the main README.

To install it yourself, from GitHub (the package lives in the `django-storio-elements-editor` folder of the repository):

```bash
pip install "git+https://github.com/MostofaSeum/storio-elements-editor.git@v1.3.3#subdirectory=django-storio-elements-editor"
```

Then `python -m storio_elements_editor setup --project <folder with manage.py> --frontend-origin http://localhost:3000` makes the settings and urls changes below automatically (add `--dry-run` to preview them), or follow the steps by hand.

Use your project's virtual environment. No build step is needed. Check it worked:

```bash
python -c "import storio_elements_editor; print(storio_elements_editor.__version__)"
```

## Set up Django

**1. Add the app** in `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    "storio_elements_editor",
]
```

**2. Add the URLs** in your root `urls.py`:

```python
from django.urls import include, path

urlpatterns = [
    # ...
    path("api/cms/", include("storio_elements_editor.urls")),
]
```

**3. Create the table:**

```bash
python manage.py migrate
```

**4. Configure media** so uploaded images can be served (skip if your project already does this):

```python
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

To open uploaded images during development, also add this to the end of your root `urls.py`. It only serves files while `DEBUG = True`:

```python
from django.conf import settings
from django.conf.urls.static import static

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

In production, serve `MEDIA_ROOT` with your web server or use a storage backend such as S3.

Uploads go through Django's default storage, so S3 or any other storage backend you've configured works too.

**That's it.** By default, any logged-in **staff** user can edit.

## Set up the React / Next.js site

Follow the main library's setup, but use `djangoAdapter` instead of `restAdapter`. You don't need the Next.js API route or `fileStorage`, because Django handles saving.

```ts
// cms.config.ts
import { defineCms } from '@brainicon/storio-elements-editor';
import { djangoAdapter } from '@brainicon/storio-elements-editor/adapters';

export const cms = defineCms({
  adapter: djangoAdapter({ baseUrl: 'https://api.example.com/api/cms' }),
  pages: [/* ... */],
});
```

`djangoAdapter` sends the Django session cookie with every request. It also gets a CSRF token from `/api/cms/csrf`, sends it on saves, uploads and resets, and refreshes it if it goes stale.

For server rendering in Next.js, read published content directly from Django:

```ts
import { getPageContent } from '@brainicon/storio-elements-editor/next';
import { restAdapter } from '@brainicon/storio-elements-editor/adapters';

const storage = restAdapter({ baseUrl: 'https://api.example.com/api/cms' }); // read-only use
const content = await getPageContent(cms, 'home', { storage });
```

### Logging in

Editors can sign in in two ways, and the API accepts both.

**1. Token login (recommended, what `npx storio-editor init` sets up).** The React site posts the editor's staff username and password to `POST api/cms/auth/login` and gets back a signed token that expires after 12 hours. The CMS sends it as `Authorization: Bearer <token>`. It needs no cookie and no CSRF token, so it also works when the site and Django are on different domains. The token is not stored in the database, and it stops working when it expires or when the user's password changes or the account is deactivated. Wrong passwords are rate limited (5 per username and IP address, then a 5 minute lockout, tracked in Django's cache).

```
POST api/cms/auth/login   {"username": "...", "password": "..."}  ->  {"token": "...", "expiresIn": 43200, "user": {...}}
GET  api/cms/auth/me      (Authorization: Bearer ...)             ->  {"user": {...}}, or 401
```

Who may sign in is decided by `AUTHORIZE` (staff users by default), so a non-staff account with the right password gets `403`.

**2. Django session.** Editors log in to Django the usual way (Django admin login, your own login page, allauth…), and the CMS uses that session. If the frontend and Django are on different domains, the session cookie must be allowed to travel with cross-site requests. See the next section.

If your site has its own login (JWT, SSO…), write an `AUTHORIZE` function for it (see Settings): it receives the normal `request`.

## Frontend and Django on different domains

Same domain (for example Django behind `example.com/api/` through a reverse proxy) needs nothing extra.

For different origins (for example `example.com` and `api.example.com`), install `django-cors-headers` and add:

```python
INSTALLED_APPS += ["corsheaders"]
MIDDLEWARE.insert(0, "corsheaders.middleware.CorsMiddleware")

CORS_ALLOWED_ORIGINS = ["https://example.com"]
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = ["https://example.com"]

# Only when the two are different *sites* (not just subdomains of one domain):
SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SECURE = True
```

Also set `publicSiteUrl` / `allowedOrigins` in the frontend CMS config if the CMS screen and the public site run on different origins.

## Settings

All settings are optional. Put them in a `STORIO_EDITOR` dict:

```python
STORIO_EDITOR = {
    # Who may edit. A dotted path to a function that receives the request.
    "AUTHORIZE": "storio_elements_editor.permissions.is_staff_user",
    # Restrict which page keys can be stored (use your frontend config's page keys).
    "ALLOWED_PAGES": None,          # e.g. ["home", "pricing", "site"]; include your global page key
    "MAX_BODY_BYTES": 1_048_576,    # largest section save (1 MB)
    "MAX_UPLOAD_BYTES": 5_242_880,  # largest image upload (5 MB)
    "UPLOAD_DIR": "cms-uploads",    # folder inside your media storage
    "ALLOW_SVG": False,             # SVG files can contain scripts; enable only if you trust editors
    "TOKEN_LOGIN": True,            # POST auth/login (editors sign in from a React admin); False removes it
    "TOKEN_MAX_AGE": 43_200,        # seconds a sign-in lasts (12 hours)
    "LOGIN_MAX_ATTEMPTS": 5,        # wrong passwords per username+IP before a lockout
    "LOGIN_LOCKOUT_SECONDS": 300,   # how long the lockout lasts
    "COLLECTIONS": {},              # your models editable on [slug] pages, see below
}
```

The old name of this setting, `VISUAL_CMS`, still works.

A custom permission check, for example for members of an "Editors" group:

```python
# myproject/cms.py
def can_edit(request):
    user = request.user
    return user.is_authenticated and user.groups.filter(name="Editors").exists()
```

```python
STORIO_EDITOR = {"AUTHORIZE": "myproject.cms.can_edit"}
```

## Pages with [slug] or [id]

A frontend page such as `/blog/[slug]` shows one row of one of your models. List that model under `COLLECTIONS`, and editors can change the row's fields from the visual editor (the CMS lists the rows in a second menu next to the page name). No views or serializers to write:

```python
STORIO_EDITOR = {
    "COLLECTIONS": {
        "blog": {
            "model": "blog.Post",                     # app_label.ModelName
            "lookup": "slug",                         # field used as the record id (default "pk")
            "label": "title",                         # field shown in the CMS menu (default str(obj))
            "fields": ["title", "summary", "cover_url"],  # the only fields editors may change
            "queryset": "blog.cms.editable_posts",    # optional: callable(request) -> QuerySet
            "on_save": "blog.cms.post_saved",         # optional: callable(obj, request), e.g. clear a cache
        },
    },
}
```

- Only editors (your `AUTHORIZE` check) can list, read or save rows. A save changes only the listed `fields`, runs the model's field validation (`full_clean` on those fields) and saves with `update_fields`.
- Text, slug, email, URL, number, boolean, date/time and JSON fields can be edited. Relations and file fields cannot; store an image as a URL text field to edit it here.
- Without `queryset`, every row of the model can be opened. Use it to limit the rows, for example to published posts.
- The key (`"blog"`) is the `collection` of the page in the frontend's `cms.config.ts`; the main README's section "Pages with [slug] or [id]" shows the frontend side.

## Django admin

Saved sections appear under **Storio Elements Editor → CMS sections**. From there admins can search them, inspect the JSON, and publish or unpublish several at once. Deleting a row resets that section to its default content.

The visual editing itself (live preview, pencil buttons, forms) happens on the React CMS page. Add a link to it in your admin menu if you like.

## API

All responses are JSON. Every path works with or without a trailing slash.

| Method | Path | Who | Result |
|---|---|---|---|
| GET | `records?page=home` | anyone | published records of a page |
| GET | `records?page=home&drafts=1` | editors | includes drafts (visitors still get published only) |
| GET | `records/<page>/<section>` | anyone | the record, or `null` if never edited |
| PUT | `records/<page>/<section>` | editors | body `{"content": ..., "isPublished": true}` |
| DELETE | `records/<page>/<section>` | editors | `204`, section back to its default |
| GET | `media` | editors | uploaded images |
| POST | `media` | editors | multipart `files` → `{"items": [...]}` |
| GET | `csrf` | anyone | `{"csrfToken": "..."}` and sets the CSRF cookie |
| POST | `auth/login` | anyone | body `{"username", "password"}` → `{"token", "expiresIn", "user"}` (`401` wrong password, `403` not an editor, `429` locked out) |
| GET | `auth/me` | editors | `{"user": {...}}`, or `401` |
| GET | `collections/<key>/items` | editors | `[{"id", "label"}]` for a model listed in `COLLECTIONS` |
| GET | `collections/<key>/items/<id>` | editors | the row's editable fields, or `404` |
| PUT | `collections/<key>/items/<id>` | editors | body `{"values": {...}}` → the row's fields after saving (`400` with `errors` when invalid) |

Writes need an editor (`401` otherwise). A request that relies on a session cookie also needs a valid `X-CSRFToken` header (`403` otherwise); a request with a valid `Authorization: Bearer` token does not, because it uses no cookie. Page and section keys may only contain letters, digits, `_` and `-`.

## Security notes

- Visitors only ever get published content. Drafts need `drafts=1` **and** an editor.
- CSRF protection stays on for every cookie-based write, with errors returned as JSON.
- Tokens are signed with your `SECRET_KEY` (`django.core.signing`): keep it secret, and rotating it signs every editor out. Behind a proxy make sure `REMOTE_ADDR` is the real client address (for example with your proxy's trusted-IP middleware), or the lockout counts everyone as one address.
- Serve the API over HTTPS in production, so passwords and tokens are not readable on the network.
- Uploads are limited to image types (no SVG by default) and a size cap. They are stored under random names, never the client's file name.

## Development

```bash
cd django-storio-elements-editor
pip install -e .
python -m django test tests --settings=tests.settings
```

(On Windows PowerShell: `$env:PYTHONPATH="."` first if the `tests` module isn't found.)

## License

MIT
