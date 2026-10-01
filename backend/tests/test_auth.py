import pytest


def test_register_invalid_domain(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Imposter",
            "email": "imposter@gmail.com",
            "password": "SecretPassword123!",
        },
    )
    assert response.status_code == 400
    assert "verified college email" in response.json()["detail"]


def test_register_valid_domain(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Danielle Green",
            "email": "danielle@example.edu",
            "password": "ValidPassword123!",
            "department": "Civil Engineering",
            "grad_year": 2026,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["email"] == "danielle@example.edu"


def test_login_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.edu", "password": "StudentPass123!"},
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid_password(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.edu", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
