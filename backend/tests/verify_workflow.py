"""
End-to-end full workflow verification script matching Section 13:
1. Open dashboard.
2. View inventory.
3. Create an order containing multiple products.
4. See stock decrease.
5. Open order details.
6. Search for the order.
7. Move order from PLACED to PACKED.
8. Move order from PACKED to SHIPPED.
9. Create another order.
10. Cancel it.
11. See stock restored.
12. Verify invalid transitions (e.g. SHIPPED -> CANCELLED) rejected with 422.
"""
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

def run_workflow_verification():
    client = TestClient(app)

    print("Step 1: Open dashboard")
    stats = client.get("/api/dashboard/stats").json()
    print(f"  -> Total orders: {stats['total_orders']}, Total inventory: {stats['total_inventory']}")

    print("Step 2: View inventory")
    products = client.get("/api/products").json()
    assert len(products) >= 6, "Expected at least 6 catalogue products"
    p1 = products[0]
    p2 = products[1]
    initial_p1_stock = p1["stock_quantity"]
    initial_p2_stock = p2["stock_quantity"]
    print(f"  -> {p1['name']}: stock={initial_p1_stock}, {p2['name']}: stock={initial_p2_stock}")

    print("Step 3: Create multi-product order")
    resp = client.post("/api/orders", json={
        "items": [
            {"product_id": p1["id"], "quantity": 2},
            {"product_id": p2["id"], "quantity": 1}
        ]
    })
    assert resp.status_code == 201, f"Failed to place order: {resp.text}"
    order = resp.json()
    order_ref = order["order_reference"]
    order_id = order["id"]
    print(f"  -> Order placed: {order_ref}, total: ₹{order['total_amount']}, status: {order['status']}")

    print("Step 4: Verify stock decrease")
    p1_after = client.get(f"/api/products/{p1['id']}").json()
    p2_after = client.get(f"/api/products/{p2['id']}").json()
    assert p1_after["stock_quantity"] == initial_p1_stock - 2
    assert p2_after["stock_quantity"] == initial_p2_stock - 1
    print(f"  -> Stock updated: {p1['name']}={p1_after['stock_quantity']}, {p2['name']}={p2_after['stock_quantity']}")

    print("Step 5: Open order details")
    order_details = client.get(f"/api/orders/{order_id}").json()
    assert len(order_details["items"]) == 2
    assert len(order_details["status_history"]) >= 1
    print(f"  -> Order items count: {len(order_details['items'])}, History entries: {len(order_details['status_history'])}")

    print("Step 6: Search for the order")
    search_results = client.get(f"/api/orders?search={order_ref}").json()
    assert len(search_results) == 1
    assert search_results[0]["order_reference"] == order_ref
    print(f"  -> Found search match for {order_ref}")

    print("Step 7: Move order from PLACED to PACKED")
    pack_resp = client.patch(f"/api/orders/{order_id}/status", json={"status": "PACKED"})
    assert pack_resp.status_code == 200
    assert pack_resp.json()["status"] == "PACKED"
    print("  -> Status advanced to PACKED")

    print("Step 8: Move order from PACKED to SHIPPED")
    ship_resp = client.patch(f"/api/orders/{order_id}/status", json={"status": "SHIPPED"})
    assert ship_resp.status_code == 200
    assert ship_resp.json()["status"] == "SHIPPED"
    print("  -> Status advanced to SHIPPED")

    print("Step 9: Create another order")
    resp2 = client.post("/api/orders", json={
        "items": [{"product_id": p1["id"], "quantity": 1}]
    })
    assert resp2.status_code == 201
    order2 = resp2.json()
    order2_id = order2["id"]
    print(f"  -> Second order created: {order2['order_reference']}")

    print("Step 10: Cancel order 2")
    cancel_resp = client.post(f"/api/orders/{order2_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"
    print("  -> Order 2 successfully cancelled")

    print("Step 11: See stock restored")
    p1_restored = client.get(f"/api/products/{p1['id']}").json()
    assert p1_restored["stock_quantity"] == p1_after["stock_quantity"]
    print(f"  -> {p1['name']} stock restored to {p1_restored['stock_quantity']}")

    print("Step 12: Invalid transition rejected (SHIPPED -> CANCELLED)")
    invalid_cancel = client.post(f"/api/orders/{order_id}/cancel")
    assert invalid_cancel.status_code == 422
    print("  -> Invalid cancellation correctly rejected with HTTP 422")

    print("\nSUCCESS: All 12 workflow operations verified and passing!")

if __name__ == "__main__":
    run_workflow_verification()
