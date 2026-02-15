from datetime import datetime, timedelta, timezone

from app.models import Quest
from .conftest import client, _TestSessionLocal


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_world():
    r = client.post("/api/worlds", json={"name": "Test World"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "Test World"
    assert 9 <= len(data["join_code"]) <= 15  # 3 words × 3-5 chars each


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
    assert len(data["challenges"]) > 0


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


def test_submit_quest_session():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "Alex", "world_id": w["id"]}).json()

    r = client.post("/api/sessions", json={
        "player_id": p["id"],
        "mode": "quest",
        "difficulty": "hour",
        "questions": 10,
        "correct": 7,
        "hints_used": 2,
    })
    assert r.status_code == 200
    data = r.json()
    assert data["points_earned"] > 0
    assert data["session"]["mode"] == "quest"


def test_tiers_endpoint():
    r = client.get("/api/tiers")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 11
    assert data[0]["name"] == "Wood"
    assert data[10]["name"] == "Clock Master"
    for item in data:
        assert "quest_run_mix" in item
        mix = item["quest_run_mix"]
        assert isinstance(mix, dict)
        assert len(mix) > 0
        assert abs(sum(mix.values()) - 1.0) < 0.01


def test_record_quest_run_and_daily_progression():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "Alex", "world_id": w["id"]}).json()

    now = datetime.now(timezone.utc)

    # 10 minutes today -> daily target 10 completed, next active target should be 20
    r = client.post("/api/challenges/quest-run", json={
        "player_id": p["id"],
        "started_at": (now - timedelta(minutes=10)).isoformat(),
        "ended_at": now.isoformat(),
        "duration_seconds": 600,
        "completed": True,
    })
    assert r.status_code == 200

    b = client.get(f"/api/players/{p['id']}/briefing")
    assert b.status_code == 200
    data = b.json()
    daily = next(c for c in data["challenges"] if c["challenge_type"] == "daily_play")
    assert daily["target"] == 20
    assert daily["progress"] >= 10


def test_record_quest_run_and_streak_progression():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "Streaky", "world_id": w["id"]}).json()

    now = datetime.now(timezone.utc)
    # 3 consecutive days, 10 minutes each
    for d in [2, 1, 0]:
        end = now - timedelta(days=d)
        start = end - timedelta(minutes=10)
        r = client.post("/api/challenges/quest-run", json={
            "player_id": p["id"],
            "started_at": start.isoformat(),
            "ended_at": end.isoformat(),
            "duration_seconds": 600,
            "completed": d == 0,
        })
        assert r.status_code == 200

    b = client.get(f"/api/players/{p['id']}/briefing")
    assert b.status_code == 200
    data = b.json()
    streak = next(c for c in data["challenges"] if c["challenge_type"] == "daily_streak")
    assert streak["target"] == 7
    assert streak["progress"] >= 3


def test_briefing_has_no_duplicate_active_challenge_types():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "NoDupes", "world_id": w["id"]}).json()

    # Call briefing repeatedly (simulates rapid screen switches)
    for _ in range(3):
        r = client.get(f"/api/players/{p['id']}/briefing")
        assert r.status_code == 200

    data = client.get(f"/api/players/{p['id']}/briefing").json()
    types = [c["challenge_type"] for c in data["challenges"]]
    assert sorted(types) == ["daily_play", "daily_streak"]


def test_daily_challenge_resets_to_10_on_new_local_day():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "ResetDaily", "world_id": w["id"]}).json()

    # Seed stale active daily_play card from yesterday at 30/30
    db = _TestSessionLocal()
    try:
        stale = Quest(
            player_id=p["id"],
            quest_type="daily_play",
            description="Play 30 minutes today",
            target=30,
            progress=30,
            completed=False,
            mode="quest",
            difficulty=None,
            created_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.add(stale)
        db.commit()
    finally:
        db.close()

    data = client.get(f"/api/players/{p['id']}/briefing").json()
    daily = next(c for c in data["challenges"] if c["challenge_type"] == "daily_play")
    assert daily["target"] == 10
    assert daily["progress"] == 0


def test_streak_shows_yesterday_progress_before_today_play():
    w = client.post("/api/worlds", json={"name": "W"}).json()
    p = client.post("/api/players", json={"nickname": "StreakCarry", "world_id": w["id"]}).json()

    now = datetime.now(timezone.utc)
    # Yesterday only: 10 minutes
    end = now - timedelta(days=1)
    start = end - timedelta(minutes=10)
    r = client.post("/api/challenges/quest-run", json={
        "player_id": p["id"],
        "started_at": start.isoformat(),
        "ended_at": end.isoformat(),
        "duration_seconds": 600,
        "completed": True,
    })
    assert r.status_code == 200

    data = client.get(f"/api/players/{p['id']}/briefing").json()
    streak = next(c for c in data["challenges"] if c["challenge_type"] == "daily_streak")
    assert streak["target"] == 3
    assert streak["progress"] == 1
