"""
Unit tests for ModelService singleton.
"""

import unittest
from backend.app.services.model_service import ModelService, get_model_service


class TestModelService(unittest.TestCase):
    """Test suite for ModelService lifecycle."""

    def test_01_singleton_identity(self):
        """Verify that get_instance returns the same singleton instance."""
        s1 = ModelService.get_instance()
        s2 = get_model_service()
        self.assertIs(s1, s2)

    def test_02_load_model(self):
        """Verify model loading and inspection methods."""
        service = get_model_service()
        service.load()
        self.assertTrue(service.is_loaded)

        pipe = service.get_pipeline()
        self.assertTrue(hasattr(pipe, "predict"))

        meta = service.get_metadata()
        self.assertEqual(meta.get("target"), "yield")
        self.assertEqual(meta.get("target_unit"), "unconfirmed")

        info = service.get_model_info()
        self.assertEqual(info["model_name"], "Random Forest")
        self.assertEqual(len(info["features"]), 30)


if __name__ == "__main__":
    unittest.main()
