import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models import Product, Order, OrderItem

# Use a file-based SQLite test database (avoids same-connection threading issues)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test_fynd.db"

engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def create_test_product(db, name="Test Product", sku=None, price=1000.0, stock=10, category="Test"):
    import uuid
    product = Product(
        name=name,
        sku=sku or f"TEST-{uuid.uuid4().hex[:6].upper()}",
        description=f"Test product: {name}",
        price=price,
        stock_quantity=stock,
        category=category,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
