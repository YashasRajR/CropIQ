"""
Unit tests for CropIQ Health Check API endpoint.
"""

import unittest
from fastapi.testclient import TestClient
from backend.app.main import app


class TestHealthEndpoint(unittest.TestCase):
    """Test suite for GET /health."""

    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_ctx.__exit__(None, None, None)

    def test_01_health_ok(self):
        """Test that /health returns HTTP 200 with ok status and loaded model."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["model_loaded"])
        self.assertEqual(data["service"], "CropIQ API")
        self.assertIsNotNone(data["model_version"])

    def test_02_health_v1_alias(self):
        """Test that /api/v1/health provides the same contract."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertTrue(data["model_loaded"])

    def test_03_request_id_headers(self):
        """Test that X-Request-ID and X-Process-Time-Ms headers are present."""
        response = self.client.get("/health")
        self.assertIn("X-Request-ID", response.headers)
        self.assertIn("X-Process-Time-Ms", response.headers)

    def test_04_custom_request_id_preserved(self):
        """Test that client-supplied X-Request-ID is preserved in response."""
        custom_id = "test-req-id-12345"
        response = self.client.get("/health", headers={"X-Request-ID": custom_id})
        self.assertEqual(response.headers.get("X-Request-ID"), custom_id)


if __name__ == "__main__":
    unittest.main()
