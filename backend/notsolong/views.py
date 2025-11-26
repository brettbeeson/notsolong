"""Project-level auxiliary views."""

from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.views import View


class SPAView(View):
    """Serve the built React index for any non-API route."""

    def get(self, request, *args, **kwargs):
        index_path = Path(settings.FRONTEND_DIST_DIR) / "index.html"
        if not index_path.exists():
            return HttpResponseNotFound("Build the frontend to enable the SPA shell.")
        return HttpResponse(index_path.read_text(encoding="utf-8"), content_type="text/html")


class SchemaView(View):
    """Serve the generated OpenAPI schema file."""

    schema_filename = "schema-apple.yml"

    def get(self, request, *args, **kwargs):
        schema_path = Path(settings.BASE_DIR) / self.schema_filename
        if not schema_path.exists():
            return HttpResponseNotFound("Generate the schema via `make schema` first.")
        return HttpResponse(schema_path.read_text(encoding="utf-8"), content_type="application/yaml")
