import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database import Base, engine


@pytest.fixture(autouse=True)
def reset_db():
    """Reset database before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_world():
    r = client.post("/api/worlds", json={"name": "Test World"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Test World"
    assert 6 <= len(data["join_code"]) <= 15


def test_join_world():
    r = client.post("/api/worlds", json={"name": "My World"})
    code = r.json()["join_code"]

    r2 = client.get(f"/api/worlds/join/{code}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "My World"


def test_join_world_not_found():
    r = client.get("/api/worlds/join/ZZZZZZ")
    assert r.status_code == 404


def test_create_player():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    r = client.post("/api/players", json={"nickname": "Alex", "world_id": w["id"]})
    assert r.status_code == 200
    assert r.json()["nickname"] == "Alex"
    assert r.json()["clock_power"] == 0


def test_get_players_in_world():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    client.post("/api/players", json={"nickname": "A", "world_id": w["id"]})
    client.post("/api/players", json={"nickname": "B", "world_id": w["id"]})

    r = client.get(f"/api/players/world/{w['id']}")
    assert len(r.json()) == 2


def test_submit_session():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "Alex", "world_id": w["id"]}).json()

    r = client.post("/api/sessions", json={
        "player_id": p["id"],
        "mode": "read",
        "difficulty": "quarter",
        "questions": 10,
        "correct": 8,
        "hints_used": 1,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["points_earned"] > 0
    assert data["new_clock_power"] > 0


def test_submit_session_validates_correct():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "A", "world_id": w["id"]}).json()

    r = client.post("/api/sessions", json={
        "player_id": p["id"],
        "mode": "read",
        "difficulty": "hour",
        "questions": 5,
        "correct": 10,  # more correct than questions
    })
    assert r.status_code == 400


def test_player_briefing():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "Alex", "world_id": w["id"]}).json()

    r = client.get(f"/api/players/{p['id']}/briefing")
    assert r.status_code == 200
    data = r.json()
    assert data["tier_name"] == "Wood"
    assert data["player"]["clock_power"] == 0
    assert len(data["quests"]) > 0


def test_trial_config():
    r = client.get("/api/trials/config/1")
    assert r.status_code == 200
    data = r.json()
    assert data["tier_name"] == "Stone"
    assert data["questions"] == 10


def test_trial_submit_needs_power():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "A", "world_id": w["id"]}).json()

    r = client.post("/api/trials", json={
        "player_id": p["id"],
        "tier": 1,
        "questions": 10,
        "correct": 10,
        "hints_used": 0,
    })
    # Should fail: player has 0 clock power, needs 100
    assert r.status_code == 400


def test_leaderboard():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    client.post("/api/players", json={"nickname": "A", "world_id": w["id"]})
    client.post("/api/players", json={"nickname": "B", "world_id": w["id"]})

    r = client.get("/api/leaderboard?scope=global")
    assert r.status_code == 200
    assert len(r.json()["entries"]) == 2


def test_leaderboard_world_scope():
    w1 = client.post("/api/worlds", json={"name": "W1"}).json()
    w2 = client.post("/api/worlds", json={"name": "W2"}).json()
    client.post("/api/players", json={"nickname": "A", "world_id": w1["id"]})
    client.post("/api/players", json={"nickname": "B", "world_id": w2["id"]})

    r = client.get(f"/api/leaderboard?scope=world&world_id={w1['id']}")
    assert len(r.json()["entries"]) == 1


def test_delete_world_cascades():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    client.post("/api/players", json={"nickname": "A", "world_id": w["id"]})

    r = client.delete(f"/api/worlds/{w['id']}")
    assert r.status_code == 200

    r2 = client.get(f"/api/players/world/{w['id']}")
    assert len(r2.json()) == 0
