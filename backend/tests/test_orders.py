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
    assert resp.status_code == 422, f"Expected 4xx but got {resp.status_code}"

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
    assert resp.status_code == 422, f"Expected 4xx, got {resp.status_code}: {resp.text}"

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
    assert second.status_code == 409, f"Expected 4xx, got {second.status_code}"

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
    assert cancel_resp.status_code == 422, f"Expected 4xx, got {cancel_resp.status_code}: {cancel_resp.text}"


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
    assert resp.status_code == 422, f"Expected 4xx, got {resp.status_code}"


# ─── TEST 10 — Invalid quantity rejected ─────────────────────────────────────

def test_invalid_quantity_rejected(client, db):
    product = create_test_product(db, stock=10)

    # quantity = 0
    resp_zero = client.post("/api/orders", json={"items": [{"product_id": product.id, "quantity": 0}]})
    assert resp_zero.status_code == 422, f"quantity=0 should be rejected, got {resp_zero.status_code}"

    # quantity = -1
    resp_neg = client.post("/api/orders", json={"items": [{"product_id": product.id, "quantity": -1}]})
    assert resp_neg.status_code == 422, f"quantity=-1 should be rejected, got {resp_neg.status_code}"


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


# ─── TEST 13 — Database persistence across restart ────────────────────────────

def test_database_persistence_across_restart(tmp_path):
    import os
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.database import Base
    from app.models import Product, Order
    from app import crud, schemas

    db_file = tmp_path / "persistent_test.db"
    db_url = f"sqlite:///{db_file}"

    # 1. First engine & session (simulate initial run)
    engine1 = create_engine(db_url)
    Session1 = sessionmaker(bind=engine1)
    Base.metadata.create_all(bind=engine1)

    with Session1() as db1:
        p = Product(name="Persistent Item", sku="PERSIST-1", price=500.0, stock_quantity=10, category="Test")
        db1.add(p)
        db1.commit()
        db1.refresh(p)
        pid = p.id

        # Place order for 4 items
        order_in = schemas.OrderCreate(items=[schemas.OrderItemIn(product_id=pid, quantity=4)])
        order = crud.create_order(db1, order_in)
        order_ref = order.order_reference

    engine1.dispose()

    # 2. Second engine & session (simulate server restart reading same file)
    assert os.path.exists(db_file)
    engine2 = create_engine(db_url)
    Session2 = sessionmaker(bind=engine2)

    with Session2() as db2:
        saved_order = crud.get_order_by_reference(db2, order_ref)
        assert saved_order is not None
        assert saved_order.status == "PLACED"
        assert saved_order.total_amount == 2000.0

        saved_product = crud.get_product(db2, pid)
        assert saved_product is not None
        assert saved_product.stock_quantity == 6  # 10 - 4 = 6
        assert saved_product.name == "Persistent Item"

    engine2.dispose()


# ─── TEST 14 — Order with multiple products returns item details & count ────

def test_order_with_multiple_products_returns_item_details_and_count(client, db):
    # 1. Create two test products
    product_a = create_test_product(db, name="Alpha Product", stock=10, price=100.0)
    product_b = create_test_product(db, name="Beta Product", stock=15, price=250.0)

    # 2. Place multi-product order: 3 of A and 4 of B (Total items: 7)
    resp = place_order(client, (product_a.id, 3), (product_b.id, 4))
    assert resp.status_code == 201, resp.text
    created = resp.json()
    order_id = created["id"]
    order_ref = created["order_reference"]

    # 3. Test GET /api/orders (list endpoint)
    list_resp = client.get("/api/orders")
    assert list_resp.status_code == 200
    orders = list_resp.json()
    matched = [o for o in orders if o["id"] == order_id]
    assert len(matched) == 1, f"Created order {order_id} not found in /api/orders"
    order_in_list = matched[0]

    # Verify items collection is returned in list response
    assert "items" in order_in_list, "GET /api/orders must return 'items' for each order"
    items = order_in_list["items"]
    assert len(items) == 2, f"Expected 2 item entries, got {len(items)}"

    # Verify total item quantity across items (not 0, but 3 + 4 = 7)
    total_quantity = sum(item["quantity"] for item in items)
    assert total_quantity == 7, f"Expected total quantity 7, got {total_quantity}"

    # Verify individual product details in list response
    item_a = next(i for i in items if i["product_id"] == product_a.id)
    assert item_a["product_name"] == "Alpha Product"
    assert item_a["product_name_snapshot"] == "Alpha Product"
    assert item_a["quantity"] == 3
    assert item_a["unit_price"] == 100.0
    assert item_a["line_total"] == 300.0

    item_b = next(i for i in items if i["product_id"] == product_b.id)
    assert item_b["product_name"] == "Beta Product"
    assert item_b["product_name_snapshot"] == "Beta Product"
    assert item_b["quantity"] == 4
    assert item_b["unit_price"] == 250.0
    assert item_b["line_total"] == 1000.0

    # 4. Test GET /api/orders/{id} (detail endpoint)
    detail_resp = client.get(f"/api/orders/{order_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert len(detail["items"]) == 2
    assert sum(i["quantity"] for i in detail["items"]) == 7

    # 5. Test GET /api/dashboard/stats recent_orders also includes items
    dash_resp = client.get("/api/dashboard/stats")
    assert dash_resp.status_code == 200
    recent = dash_resp.json()["recent_orders"]
    recent_matched = [o for o in recent if o["id"] == order_id]
    if recent_matched:
        assert len(recent_matched[0]["items"]) == 2
        assert sum(i["quantity"] for i in recent_matched[0]["items"]) == 7


def test_duplicate_product_items_cannot_oversell_stock(client, db):
    product = create_test_product(db, name="Headphones", stock=10, price=100.0)

    # Request the same product twice: total requested quantity is 14.
    resp = place_order(
        client,
        (product.id, 7),
        (product.id, 7),
    )

    # The order must be rejected because only 10 units exist.
    assert resp.status_code == 422

    # Inventory must remain unchanged.
    stock_resp = client.get(f"/api/products/{product.id}")
    assert stock_resp.json()["stock_quantity"] == 10

    # No partial order must be created.
    orders_resp = client.get("/api/orders")
    assert orders_resp.json() == []


def test_duplicate_product_items_with_sufficient_stock_are_combined(client, db):
    product = create_test_product(db, name="Keyboard", stock=10, price=100.0)

    resp = place_order(
        client,
        (product.id, 3),
        (product.id, 2),
    )

    assert resp.status_code == 201

    order = resp.json()
    assert len(order["items"]) == 1
    assert order["items"][0]["quantity"] == 5
    assert order["total_amount"] == 500.0

    stock_resp = client.get(f"/api/products/{product.id}")
    assert stock_resp.json()["stock_quantity"] == 5

def test_packed_order_cancellation_restores_stock(client, db):
    product = create_test_product(db, name="Packed Keyboard", stock=10, price=100.0)

    resp = place_order(client, (product.id, 3))
    assert resp.status_code == 201

    order = resp.json()
    order_id = order["id"]

    pack_resp = client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "PACKED"},
    )
    assert pack_resp.status_code == 200

    cancel_resp = client.post(f"/api/orders/{order_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    stock_resp = client.get(f"/api/products/{product.id}")
    assert stock_resp.json()["stock_quantity"] == 10

    # Confirm cancellation cannot restore the same stock twice.
    second_cancel = client.post(f"/api/orders/{order_id}/cancel")
    assert second_cancel.status_code == 409

    stock_resp = client.get(f"/api/products/{product.id}")
    assert stock_resp.json()["stock_quantity"] == 10


def test_order_status_history_records_transitions(client, db):
    product = create_test_product(db, name="History Mouse", stock=10, price=100.0)

    resp = place_order(client, (product.id, 2))
    assert resp.status_code == 201

    order_id = resp.json()["id"]

    pack_resp = client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "PACKED"},
    )
    assert pack_resp.status_code == 200

    cancel_resp = client.post(f"/api/orders/{order_id}/cancel")
    assert cancel_resp.status_code == 200

    detail_resp = client.get(f"/api/orders/{order_id}")
    assert detail_resp.status_code == 200

    history = detail_resp.json()["status_history"]

    assert len(history) == 3
    assert [entry["to_status"] for entry in history] == [
        "PLACED",
        "PACKED",
        "CANCELLED",
    ]
    assert history[0]["from_status"] is None
    assert history[1]["from_status"] == "PLACED"
    assert history[2]["from_status"] == "PACKED"

def test_non_positive_product_id_rejected(client, db):
    product = create_test_product(db, stock=10)

    for invalid_id in (0, -1):
        response = client.post(
            "/api/orders",
            json={"items": [{"product_id": invalid_id, "quantity": 1}]},
        )
        assert response.status_code == 422, response.text

    assert client.get(f"/api/products/{product.id}").json()["stock_quantity"] == 10
    assert client.get("/api/orders").json() == []


def test_unsupported_order_status_rejected(client, db):
    product = create_test_product(db, stock=5)
    order_response = place_order(client, (product.id, 1))
    assert order_response.status_code == 201

    order_id = order_response.json()["id"]

    response = client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "DELIVERED"},
    )

    assert response.status_code == 422, response.text
    assert client.get(f"/api/orders/{order_id}").json()["status"] == "PLACED"

def test_stale_order_status_update_returns_conflict(client, db):
    from fastapi import HTTPException
    from app import crud

    product = create_test_product(db, stock=5)
    response = place_order(client, (product.id, 1))
    assert response.status_code == 201

    order_id = response.json()["id"]

    stale_order = crud.get_order(db, order_id)

    client.patch(
        f"/api/orders/{order_id}/status",
        json={"status": "PACKED"},
    )

    try:
        crud.update_order_status(db, stale_order, "PACKED")
        assert False, "Expected stale update to fail"
    except HTTPException as exc:
        assert exc.status_code == 409

    assert client.get(f"/api/orders/{order_id}").json()["status"] == "PACKED"
