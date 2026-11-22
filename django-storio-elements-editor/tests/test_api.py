import json

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from storio_elements_editor.models import CmsRecord

BASE = "/api/cms"


def can_edit_everything(request):
    return True


class ApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.staff = User.objects.create_user("editor", password="pw", is_staff=True)
        self.user = User.objects.create_user("visitor", password="pw")
        self.editor = Client()
        self.editor.force_login(self.staff)
        self.anon = Client()

    def put(self, client, page, section, content, published=True):
        return client.put(
            f"{BASE}/records/{page}/{section}",
            data=json.dumps({"content": content, "isPublished": published}),
            content_type="application/json",
        )

    # ----------------------------------------------------------------- records

    def test_save_read_and_reset(self):
        res = self.put(self.editor, "home", "hero", {"title": "Hi"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            {k: res.json()[k] for k in ("page", "sectionKey", "content", "isPublished", "updatedBy")},
            {"page": "home", "sectionKey": "hero", "content": {"title": "Hi"}, "isPublished": True, "updatedBy": "editor"},
        )

        self.assertEqual(self.anon.get(f"{BASE}/records/home/hero").json()["content"], {"title": "Hi"})
        self.assertEqual(len(self.anon.get(f"{BASE}/records?page=home").json()), 1)

        # Saving again updates the same row.
        self.put(self.editor, "home", "hero", {"title": "Again"})
        self.assertEqual(CmsRecord.objects.count(), 1)

        self.assertEqual(self.editor.delete(f"{BASE}/records/home/hero").status_code, 204)
        self.assertIsNone(self.anon.get(f"{BASE}/records/home/hero").json())

    def test_never_edited_section_returns_null_not_404(self):
        res = self.anon.get(f"{BASE}/records/home/hero")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json())

    def test_drafts_only_for_editors_who_ask(self):
        self.put(self.editor, "home", "faq", {"title": "Draft"}, published=False)

        self.assertEqual(self.anon.get(f"{BASE}/records?page=home&drafts=1").json(), [])
        self.assertIsNone(self.anon.get(f"{BASE}/records/home/faq?drafts=1").json())
        self.assertEqual(self.editor.get(f"{BASE}/records?page=home").json(), [])
        self.assertEqual(len(self.editor.get(f"{BASE}/records?page=home&drafts=1").json()), 1)
        self.assertEqual(self.editor.get(f"{BASE}/records/home/faq?drafts=1").json()["isPublished"], False)

    def test_trailing_slash_is_optional(self):
        self.assertEqual(self.put(self.editor, "home", "hero/", {"a": 1}).status_code, 200)
        self.assertEqual(self.anon.get(f"{BASE}/records/").status_code, 200)

    def test_writes_require_an_editor(self):
        self.assertEqual(self.put(self.anon, "home", "hero", {}).status_code, 401)
        logged_in = Client()
        logged_in.force_login(self.user)  # authenticated but not staff
        self.assertEqual(self.put(logged_in, "home", "hero", {}).status_code, 401)
        self.assertEqual(logged_in.delete(f"{BASE}/records/home/hero").status_code, 401)
        self.assertEqual(logged_in.get(f"{BASE}/media").status_code, 401)
        self.assertEqual(CmsRecord.objects.count(), 0)

    def test_validation(self):
        self.assertEqual(self.put(self.editor, "home", "hero", None).status_code, 400)
        bad_json = self.editor.put(f"{BASE}/records/home/hero", data="{nope", content_type="application/json")
        self.assertEqual(bad_json.status_code, 400)
        # Keys with other characters never match the URL patterns.
        self.assertEqual(self.anon.get(f"{BASE}/records/ho me/hero").status_code, 404)
        self.assertEqual(self.anon.get(f"{BASE}/records?page=bad!key").status_code, 400)
        self.assertEqual(self.anon.post(f"{BASE}/records").status_code, 405)

    @override_settings(STORIO_EDITOR={"ALLOWED_PAGES": ["home"]})
    def test_allowed_pages(self):
        self.assertEqual(self.put(self.editor, "blog", "hero", {}).status_code, 404)
        self.assertEqual(self.put(self.editor, "home", "hero", {}).status_code, 200)

    @override_settings(STORIO_EDITOR={"ALLOWED_PAGES": ["home", "site"]})
    def test_global_site_page_is_an_ordinary_page_key(self):
        # Site-wide content (header, footer, theme) is saved under the global page's key.
        self.assertEqual(self.put(self.editor, "site", "header", {"logoText": "Acme"}).status_code, 200)
        self.assertEqual(self.put(self.editor, "site", "theme", {"primaryColor": "#7c3aed"}).status_code, 200)
        records = self.anon.get(f"{BASE}/records?page=site").json()
        self.assertEqual({r["sectionKey"] for r in records}, {"header", "theme"})
        self.assertEqual(len(self.anon.get(f"{BASE}/records?page=home").json()), 0)

    @override_settings(VISUAL_CMS={"ALLOWED_PAGES": ["home"]})
    def test_settings_name_from_before_the_rename_still_works(self):
        self.assertEqual(self.put(self.editor, "blog", "hero", {}).status_code, 404)

    @override_settings(STORIO_EDITOR={"MAX_BODY_BYTES": 50})
    def test_body_size_limit(self):
        self.assertEqual(self.put(self.editor, "home", "hero", {"text": "x" * 200}).status_code, 413)

    @override_settings(STORIO_EDITOR={"AUTHORIZE": "tests.test_api.can_edit_everything"})
    def test_custom_authorize(self):
        self.assertEqual(self.put(self.anon, "home", "hero", {"a": 1}).status_code, 200)
        self.assertIsNone(CmsRecord.objects.get().updated_by)

    # ----------------------------------------------------------------- CSRF

    def test_csrf_is_enforced_and_token_endpoint_works(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.staff)

        self.assertEqual(self.put(client, "home", "hero", {"a": 1}).status_code, 403)

        token = client.get(f"{BASE}/csrf").json()["csrfToken"]
        res = client.put(
            f"{BASE}/records/home/hero",
            data=json.dumps({"content": {"a": 1}}),
            content_type="application/json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["isPublished"])  # isPublished defaults to true

    # ----------------------------------------------------------------- media

    def test_upload_and_list_media(self):
        png = SimpleUploadedFile("../../evil name.png", b"\x89PNG fake", content_type="image/png")
        html = SimpleUploadedFile("page.html", b"<script>", content_type="text/html")
        res = self.editor.post(f"{BASE}/media", {"files": [png, html]})
        self.assertEqual(res.status_code, 201)
        items = res.json()["items"]
        self.assertEqual(len(items), 1)
        self.assertRegex(items[0]["url"], r"^http://testserver/media/cms-uploads/[0-9a-f]{8}_evil_name\.png$")

        listed = self.editor.get(f"{BASE}/media").json()
        self.assertEqual(len(listed), 1)
        self.assertTrue(listed[0]["url"].startswith("http://testserver/media/cms-uploads/"))

    def test_svg_blocked_by_default(self):
        svg = SimpleUploadedFile("logo.svg", b"<svg/>", content_type="image/svg+xml")
        self.assertEqual(self.editor.post(f"{BASE}/media", {"files": [svg]}).status_code, 400)
        with self.settings(STORIO_EDITOR={"ALLOW_SVG": True}):
            svg.seek(0)
            self.assertEqual(self.editor.post(f"{BASE}/media", {"files": [svg]}).status_code, 201)

    def test_upload_requires_editor(self):
        png = SimpleUploadedFile("a.png", b"x", content_type="image/png")
        self.assertEqual(self.anon.post(f"{BASE}/media", {"files": [png]}).status_code, 401)


class AdminTests(TestCase):
    def test_admin_changelist_renders(self):
        admin = get_user_model().objects.create_superuser("root", "root@example.com", "pw")
        CmsRecord.objects.create(page="home", section_key="hero", content={"a": 1})
        client = Client()
        client.force_login(admin)
        self.assertEqual(client.get("/admin/visual_cms/cmsrecord/").status_code, 200)
