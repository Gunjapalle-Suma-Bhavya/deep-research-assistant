import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestApiEndpoints(unittest.TestCase):
    """Test suite for FastAPI REST API endpoints."""

    def test_health_check(self):
        """Verify /api/health endpoint returns 200."""
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("service", data)

    def test_history_endpoint(self):
        """Verify /api/research/history endpoint returns list."""
        response = client.get("/api/research/history")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_start_research_validation(self):
        """Verify empty query returns 400."""
        response = client.post("/api/research/start", json={"query": ""})
        self.assertEqual(response.status_code, 400)

    def test_get_config(self):
        """Verify /api/config endpoint returns configuration model."""
        response = client.get("/api/config")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("openai_configured", data)
        self.assertIn("openai_masked_key", data)
        self.assertIn("openai_model", data)
        self.assertIn("search_provider", data)

    def test_update_config(self):
        """Verify /api/config POST updates runtime settings."""
        payload = {
            "openai_model": "gpt-4o-mini",
            "demo_mode": True,
        }
        response = client.post("/api/config", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["openai_model"], "gpt-4o-mini")
        self.assertTrue(data["demo_mode"])

    def test_connection_diagnostic_empty_key(self):
        """Verify /api/config/test handles empty API key gracefully."""
        response = client.post("/api/config/test", json={"openai_api_key": ""})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("llm_connected", data)
        self.assertIn("search_connected", data)

    def test_clear_history_endpoint(self):
        """Verify DELETE /api/research/history/clear returns success."""
        response = client.delete("/api/research/history/clear")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])


if __name__ == "__main__":
    unittest.main()


