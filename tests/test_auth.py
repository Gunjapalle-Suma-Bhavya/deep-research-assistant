"""Tests for Authentication, Password Hashing, JWT, and Google OAuth."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestAuthenticationEndpoints:
    """Test suite for user registration, authentication, and profile retrieval."""

    def test_signup_success(self):
        """Test creating a new account."""
        email = f"test_user_{pytest.importorskip('uuid').uuid4().hex[:8]}@example.com"
        payload = {
            "name": "Jane Doe",
            "email": email,
            "password": "SecurePassword123!",
        }
        res = client.post("/api/auth/signup", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == email
        assert data["user"]["name"] == "Jane Doe"

    def test_signup_duplicate_email_fails(self):
        """Test registering the same email twice returns 400 error."""
        email = f"duplicate_{pytest.importorskip('uuid').uuid4().hex[:8]}@example.com"
        payload = {
            "name": "First User",
            "email": email,
            "password": "Password123!",
        }
        res1 = client.post("/api/auth/signup", json=payload)
        assert res1.status_code == 200

        res2 = client.post("/api/auth/signup", json=payload)
        assert res2.status_code == 400
        assert "already exists" in res2.json()["detail"]

    def test_login_success(self):
        """Test logging into an existing account."""
        email = f"login_user_{pytest.importorskip('uuid').uuid4().hex[:8]}@example.com"
        password = "SecretPassword456"
        signup_res = client.post("/api/auth/signup", json={
            "name": "Login Tester",
            "email": email,
            "password": password,
        })
        assert signup_res.status_code == 200

        login_res = client.post("/api/auth/login", json={
            "email": email,
            "password": password,
        })
        assert login_res.status_code == 200
        data = login_res.json()
        assert "access_token" in data
        assert data["user"]["email"] == email

    def test_login_invalid_password_fails(self):
        """Test logging in with bad credentials returns 401 error."""
        email = f"bad_pass_{pytest.importorskip('uuid').uuid4().hex[:8]}@example.com"
        client.post("/api/auth/signup", json={
            "name": "Bad Pass Tester",
            "email": email,
            "password": "CorrectPassword!",
        })

        res = client.post("/api/auth/login", json={
            "email": email,
            "password": "WrongPassword123",
        })
        assert res.status_code == 401

    def test_get_current_user_profile(self):
        """Test /api/auth/me returns the authenticated user data."""
        email = f"profile_user_{pytest.importorskip('uuid').uuid4().hex[:8]}@example.com"
        signup_res = client.post("/api/auth/signup", json={
            "name": "Profile Owner",
            "email": email,
            "password": "ValidPassword789",
        })
        token = signup_res.json()["access_token"]

        me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email
        assert me_res.json()["name"] == "Profile Owner"

    def test_google_auth_auto_provision(self):
        """Test Google authentication auto-provisions and returns access token."""
        google_email = f"google_user_{pytest.importorskip('uuid').uuid4().hex[:8]}@gmail.com"
        res = client.post("/api/auth/google", json={
            "email": google_email,
            "name": "Google User",
            "picture": "https://lh3.googleusercontent.com/test-pic",
        })
        assert res.status_code == 200
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == google_email
        assert data["user"]["auth_provider"] == "google"
