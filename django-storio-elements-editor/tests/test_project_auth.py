"""
AUTHENTICATE (the project's own token, e.g. a JWT) and UPLOAD_DIR as a function of the request
(e.g. one folder per tenant).
"""

import json
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from storio_elements_editor.models import CmsRecord

BASE = "/api/cms"

# A fake "JWT": the header value "Bearer jwt-<username>" identifies that user.
def jwt_user(request):
    scheme, _, value = request.META.get("HTTP_AUTHORIZATION", "").partition(" ")
    if scheme.lower() != "bearer" or not value.startswith("jwt-"):
        return None
    return get_user_model().objects.filter(username=value[4:]).first()


def jwt_user_drf_style(request):
    user = jwt_user(request)
    return (user, "raw-token") if user else None


def jwt_user_that_crashes(request):
    raise RuntimeError("token service down")


def jwt_user_from_session(request):
    # A wrong AUTHENTICATE that trusts the session. It must never be asked without a header.
    return request.user if request.user.is_authenticated else None


def any_active_user(request):
    return request.user.is_authenticated


def tenant_dir(request):
    return f"cms-uploads/{request.headers.get('X-Tenant', 'none')}"


PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4"
    b"\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
)


def put(client, headers=None, page="home", section="hero"):
    return client.put(
        f"{BASE}/records/{page}/{section}",
        data=json.dumps({"content": {"title": "Hi"}, "isPublished": True}),
        content_type="application/json",
        **(headers or {}),
    )


@override_settings(STORIO_EDITOR={"AUTHENTICATE": "tests.test_project_auth.jwt_user", "AUTHORIZE": "tests.test_project_auth.any_active_user"})
class ProjectAuthTests(TestCase):
    def setUp(self):
        cache.clear()
        User = get_user_model()
        self.ana = User.objects.create_user("ana", password="pw12345")  # not staff: AUTHORIZE decides
        self.gone = User.objects.create_user("gone", password="pw12345", is_active=False)
        self.client = Client(enforce_csrf_checks=True)

    def test_project_token_saves_without_csrf_and_sets_updated_by(self):
        res = put(self.client, {"HTTP_AUTHORIZATION": "Bearer jwt-ana"})
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["updatedBy"], "ana")
        self.assertEqual(CmsRecord.objects.get().updated_by, self.ana)

    def test_unknown_or_missing_token_is_refused(self):
        self.assertEqual(put(self.client, {"HTTP_AUTHORIZATION": "Bearer jwt-ghost"}).status_code, 403)
        self.assertEqual(put(self.client).status_code, 403)
        self.assertFalse(CmsRecord.objects.exists())

    def test_inactive_user_is_refused(self):
        self.assertEqual(put(self.client, {"HTTP_AUTHORIZATION": "Bearer jwt-gone"}).status_code, 403)

    def test_project_token_can_read_drafts_and_auth_me(self):
        CmsRecord.objects.create(page="home", section_key="hero", content={"t": 1}, is_published=False)
        headers = {"HTTP_AUTHORIZATION": "Bearer jwt-ana"}
        self.assertEqual(len(self.client.get(f"{BASE}/records?page=home&drafts=1", **headers).json()), 1)
        self.assertEqual(self.client.get(f"{BASE}/records?page=home&drafts=1").json(), [])
        me = self.client.get(f"{BASE}/auth/me", **headers)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["user"]["username"], "ana")

    @override_settings(STORIO_EDITOR={"AUTHENTICATE": "tests.test_project_auth.jwt_user_drf_style", "AUTHORIZE": "tests.test_project_auth.any_active_user"})
    def test_drf_style_tuple_result_is_accepted(self):
        self.assertEqual(put(self.client, {"HTTP_AUTHORIZATION": "Bearer jwt-ana"}).status_code, 200)

    @override_settings(STORIO_EDITOR={"AUTHENTICATE": jwt_user, "AUTHORIZE": any_active_user})
    def test_callable_setting_is_accepted(self):
        self.assertEqual(put(self.client, {"HTTP_AUTHORIZATION": "Bearer jwt-ana"}).status_code, 200)

    @override_settings(STORIO_EDITOR={"AUTHENTICATE": "tests.test_project_auth.jwt_user_that_crashes", "AUTHORIZE": "tests.test_project_auth.any_active_user"})
    def test_crashing_authenticate_counts_as_no_user(self):
        self.assertEqual(put(self.client, {"HTTP_AUTHORIZATION": "Bearer jwt-ana"}).status_code, 403)

    @override_settings(STORIO_EDITOR={"AUTHENTICATE": "tests.test_project_auth.jwt_user_from_session", "AUTHORIZE": "tests.test_project_auth.any_active_user"})
    def test_session_cookie_never_skips_csrf_even_with_a_careless_authenticate(self):
        self.client.force_login(self.ana)
        res = put(self.client)  # no Authorization header, no CSRF token
        self.assertEqual(res.status_code, 403)
        self.assertIn("CSRF", res.json()["detail"])

    def test_own_login_token_still_works_next_to_authenticate(self):
        staff = get_user_model().objects.create_user("eda", password="pw12345", is_staff=True)
        token = self.client.post(
            f"{BASE}/auth/login", data=json.dumps({"username": "eda", "password": "pw12345"}), content_type="application/json"
        ).json()["token"]
        res = put(self.client, {"HTTP_AUTHORIZATION": f"Bearer {token}"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(CmsRecord.objects.get().updated_by, staff)


class DefaultsUnchangedTests(TestCase):
    def test_without_authenticate_a_foreign_bearer_token_is_not_a_user(self):
        get_user_model().objects.create_user("ana", password="pw12345", is_staff=True)
        client = Client(enforce_csrf_checks=True)
        self.assertEqual(put(client, {"HTTP_AUTHORIZATION": "Bearer jwt-ana"}).status_code, 403)


@override_settings(STORIO_EDITOR={"UPLOAD_DIR": tenant_dir})
class UploadDirTests(TestCase):
    def setUp(self):
        self.staff = get_user_model().objects.create_user("editor", password="pw12345", is_staff=True)
        self.client = Client()
        self.client.force_login(self.staff)

    def upload(self, tenant):
        return self.client.post(
            f"{BASE}/media", {"files": SimpleUploadedFile("logo.png", PNG, content_type="image/png")}, HTTP_X_TENANT=tenant
        )

    def test_each_tenant_gets_its_own_folder_and_list(self):
        res = self.upload("alpha")
        self.assertEqual(res.status_code, 201, res.content)
        self.assertIn("/media/cms-uploads/alpha/", res.json()["items"][0]["url"])
        self.assertTrue(os.listdir(os.path.join(settings.MEDIA_ROOT, "cms-uploads", "alpha")))

        self.assertEqual(len(self.client.get(f"{BASE}/media", HTTP_X_TENANT="alpha").json()), 1)
        self.assertEqual(self.client.get(f"{BASE}/media", HTTP_X_TENANT="beta").json(), [])

    def test_unsafe_folder_is_refused(self):
        for bad in ("../escape", "/abs/../x", "a//b", "", "sp ace"):
            with self.subTest(bad=bad), override_settings(STORIO_EDITOR={"UPLOAD_DIR": lambda request, bad=bad: bad}):
                self.assertEqual(self.upload("alpha").status_code, 500)
                self.assertEqual(self.client.get(f"{BASE}/media").status_code, 500)

    @override_settings(STORIO_EDITOR={"UPLOAD_DIR": "cms-uploads"})
    def test_plain_string_still_works(self):
        res = self.upload("alpha")
        self.assertEqual(res.status_code, 201)
        self.assertRegex(res.json()["items"][0]["url"], r"/media/cms-uploads/[0-9a-f]{8}_logo\.png$")
