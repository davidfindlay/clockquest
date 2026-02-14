"""
Shared test fixtures.

All API tests use an isolated in-memory SQLite database so the real
clockquest.db is never touched during testing.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

# In-memory SQLite for tests — totally separate from production DB.
# StaticPool ensures every connection shares the same in-memory database,
# so tables created via create_all are visible to all sessions.
_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)


@pytest.fixture(autouse=True)
def test_db():
    """Create fresh tables before each test, drop after."""
    Base.metadata.create_all(bind=_test_engine)
    yield
    Base.metadata.drop_all(bind=_test_engine)


def _override_get_db():
    db = _TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override the get_db dependency so all routes use the test DB
app.dependency_overrides[get_db] = _override_get_db

client = TestClient(app)
