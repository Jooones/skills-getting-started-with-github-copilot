from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_root_redirect():
    response = client.get("/")
    assert response.status_code == 200 or response.status_code == 307
    # Should redirect to /static/index.html
    if response.status_code == 307:
        assert response.headers["location"].endswith("/static/index.html")

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Basketball" in data

def test_signup_for_activity_success():
    response = client.post("/activities/Basketball/signup", params={"email": "newstudent@mergington.edu"})
    assert response.status_code == 200
    assert "Signed up newstudent@mergington.edu for Basketball" in response.json()["message"]

    # Clean up
    client.delete("/activities/Basketball/participants", params={"email": "newstudent@mergington.edu"})

def test_signup_for_activity_already_signed_up():
    # Use an existing participant
    response = client.post("/activities/Basketball/signup", params={"email": "alex@mergington.edu"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"

def test_signup_for_activity_not_found():
    response = client.post("/activities/Nonexistent/signup", params={"email": "someone@mergington.edu"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

def test_unregister_participant_success():
    # Add, then remove
    client.post("/activities/Chess Club/signup", params={"email": "temp@mergington.edu"})
    response = client.delete("/activities/Chess Club/participants", params={"email": "temp@mergington.edu"})
    assert response.status_code == 200
    assert "Unregistered temp@mergington.edu from Chess Club" in response.json()["message"]

def test_unregister_participant_not_found():
    response = client.delete("/activities/Chess Club/participants", params={"email": "notfound@mergington.edu"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in activity"

def test_unregister_activity_not_found():
    response = client.delete("/activities/Nonexistent/participants", params={"email": "someone@mergington.edu"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"
