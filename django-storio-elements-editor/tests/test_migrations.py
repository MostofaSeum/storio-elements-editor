from io import StringIO

from django.apps import apps
from django.core.management import call_command
from django.db import connection
from django.test import TestCase


class MigrationTests(TestCase):
    def test_app_is_installed_with_its_old_label(self):
        # The label stays "visual_cms" so databases from before the rename keep working.
        config = apps.get_app_config("visual_cms")
        self.assertEqual(config.name, "storio_elements_editor")

    def test_migrations_create_the_record_table(self):
        from storio_elements_editor.models import CmsRecord

        self.assertIn(CmsRecord._meta.db_table, connection.introspection.table_names())

    def test_models_have_no_missing_migrations(self):
        out = StringIO()
        try:
            call_command("makemigrations", "visual_cms", "--check", "--dry-run", stdout=out, stderr=out)
        except SystemExit:
            self.fail("Model changes have no migration. Run makemigrations.\n" + out.getvalue())
