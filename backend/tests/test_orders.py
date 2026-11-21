"""
FYND OPS — Full pytest test suite (12 tests)
"""
import pytest
from tests.conftest import create_test_product


# ─── Helper ──────────────────────────────────────────────────────────────────

def place_order(client, *product_qty_pairs):
    """Place an order with one or more (product_id, quantity) pairs."""
    items = [{"product_id": pid, "quantity": qty} for pid, qty in product_qty_pairs]
    return client.post("/api/orders", json={"items": items})


def advance_to_packed(client, order_id):
    return client.patch(f"/api/orders/{order_id}/status", json={"status": "PACKED"})


def advance_to_shipped(client, order_id):
    return client.patch(f"/api/orders/{order_id}/status", json={"status": "SHIPPED"})


# ─── TEST 1 — Successful order placement ─────────────────────────────────────

def test_successful_order_placement(client, db):
    product = create_test_product(db, name="Widget A", stock=5, price=100.0)

    resp = place_order(client, (product.id, 2))
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "order_reference" in data
    assert data["order_reference"].startswith("ORD-")
    assert data["status"] == "PLACED"

    # Stock must have been decremented
    stock_resp = client.get(f"/api/products/{product.id}")
    assert stock_resp.status_code == 200
    assert stock_resp.json()["stock_quantity"] == 3


# ─── TEST 2 — Insufficient stock atomic rejection ─────────────────────────────

def test_insufficient_stock_atomic_rejection(client, db):
    product_a = create_test_product(db, name="Prod A", stock=5, price=100.0)
    product_b = create_test_product(db, name="Prod B", stock=0, price=200.0)

    resp = place_order(client, (product_a.id, 2), (product_b.id, 1))
    assert resp.status_code >= 400, f"Expected 4xx but got {resp.status_code}"

    # Stock for A must be UNCHANGED
    a_resp = client.get(f"/api/products/{product_a.id}")
    assert a_resp.json()["stock_quantity"] == 5

    # Stock for B must be UNCHANGED
    b_resp = client.get(f"/api/products/{product_b.id}")
    assert b_resp.json()["stock_quantity"] == 0

    # No orders should have been created
    orders_resp = client.get("/api/orders")
    assert orders_resp.status_code == 200
    assert orders_resp.json() == []


# ─── TEST 3 — Invalid state transition PLACED→SHIPPED ────────────────────────

def test_invalid_transition_placed_to_shipped(client, db):
    product = create_test_product(db, stock=5)
    order_resp = place_order(client, (product.id, 1))
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    resp = client.patch(f"/api/orders/{order_id}/status", json={"status": "SHIPPED"})
    assert resp.status_code >= 400, f"Expected 4xx, got {resp.status_code}: {resp.text}"

    # Status must still be PLACED
    get_resp = client.get(f"/api/orders/{order_id}")
    assert get_resp.json()["status"] == "PLACED"


# ─── TEST 4 — Cancellation restores stock ────────────────────────────────────

def test_cancellation_restores_stock(client, db):
    product = create_test_product(db, name="Restorable", stock=10, price=50.0)

    order_resp = place_order(client, (product.id, 3))
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    # Stock should now be 7
    assert client.get(f"/api/products/{product.id}").json()["stock_quantity"] == 7

    cancel_resp = client.post(f"/api/orders/{order_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # Stock should be restored to 10
    assert client.get(f"/api/products/{product.id}").json()["stock_quantity"] == 10


# ─── TEST 5 — Duplicate cancellation rejected ────────────────────────────────

def test_duplicate_cancellation_rejected(client, db):
    product = create_test_product(db, stock=10)
    order_resp = place_order(client, (product.id, 3))
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    # First cancel — must succeed
    first = client.post(f"/api/orders/{order_id}/cancel")
    assert first.status_code == 200

    # Second cancel — must fail
    second = client.post(f"/api/orders/{order_id}/cancel")
    assert second.status_code >= 400, f"Expected 4xx, got {second.status_code}"

    # Stock must still be 10, not 13 (restored twice)
    assert client.get(f"/api/products/{product.id}").json()["stock_quantity"] == 10


# ─── TEST 6 — Cancellation from SHIPPED rejected ─────────────────────────────

def test_cancellation_from_shipped_rejected(client, db):
    product = create_test_product(db, stock=5)
    order_resp = place_order(client, (product.id, 1))
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    assert advance_to_packed(client, order_id).status_code == 200
    assert advance_to_shipped(client, order_id).status_code == 200

    cancel_resp = client.post(f"/api/orders/{order_id}/cancel")
    assert cancel_resp.status_code >= 400, f"Expected 4xx, got {cancel_resp.status_code}: {cancel_resp.text}"


# ─── TEST 7 — PLACED→PACKED succeeds ─────────────────────────────────────────

def test_placed_to_packed_succeeds(client, db):
    product = create_test_product(db, stock=5)
    order_resp = place_order(client, (product.id, 1))
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    resp = advance_to_packed(client, order_id)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "PACKED"

    # Confirm via GET
    assert client.get(f"/api/orders/{order_id}").json()["status"] == "PACKED"


# ─── TEST 8 — PACKED→SHIPPED succeeds ────────────────────────────────────────

def test_packed_to_shipped_succeeds(client, db):
    product = create_test_product(db, stock=5)
    order_resp = place_order(client, (product.id, 1))
    assert order_resp.status_code == 201
    order_id = order_resp.json()["id"]

    assert advance_to_packed(client, order_id).status_code == 200

    resp = advance_to_shipped(client, order_id)
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "SHIPPED"

    assert client.get(f"/api/orders/{order_id}").json()["status"] == "SHIPPED"


# ─── TEST 9 — Empty order rejected ───────────────────────────────────────────

def test_empty_order_rejected(client, db):
    resp = client.post("/api/orders", json={"items": []})
    assert resp.status_code >= 400, f"Expected 4xx, got {resp.status_code}"


# ─── TEST 10 — Invalid quantity rejected ─────────────────────────────────────

def test_invalid_quantity_rejected(client, db):
    product = create_test_product(db, stock=10)

    # quantity = 0
    resp_zero = client.post("/api/orders", json={"items": [{"product_id": product.id, "quantity": 0}]})
    assert resp_zero.status_code >= 400, f"quantity=0 should be rejected, got {resp_zero.status_code}"

    # quantity = -1
    resp_neg = client.post("/api/orders", json={"items": [{"product_id": product.id, "quantity": -1}]})
    assert resp_neg.status_code >= 400, f"quantity=-1 should be rejected, got {resp_neg.status_code}"


# ─── TEST 11 — Dashboard stats endpoint ──────────────────────────────────────

def test_dashboard_stats(client, db):
    resp = client.get("/api/dashboard/stats")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    for key in ("total_orders", "placed", "packed", "shipped", "cancelled", "total_inventory"):
        assert key in data, f"Missing key '{key}' in dashboard stats"


# ─── TEST 12 — Health endpoint ───────────────────────────────────────────────

def test_health_endpoint(client, db):
    resp = client.get("/health")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data.get("status") == "ok"
