import random
import string
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.orm import Session, selectinload

from app import models, schemas


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── VALID TRANSITIONS ───────────────────────────────────────────────────────

VALID_TRANSITIONS = {
    "PLACED": ["PACKED", "CANCELLED"],
    "PACKED": ["SHIPPED", "CANCELLED"],
    "SHIPPED": [],
    "CANCELLED": [],
}


# ─── Products ────────────────────────────────────────────────────────────────

def get_products(db: Session) -> List[models.Product]:
    return db.execute(select(models.Product)).scalars().all()


def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.execute(
        select(models.Product).where(models.Product.id == product_id)
    ).scalar_one_or_none()


# ─── Orders ──────────────────────────────────────────────────────────────────

def _generate_order_reference() -> str:
    date_part = utc_now().strftime("%Y%m%d")
    random_part = "".join(random.choices(string.digits, k=6))
    return f"ORD-{date_part}-{random_part}"


def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    # ── Validate every item first (no DB writes yet) ──────────────────────
    validated = []
    for item in order_in.items:
        product = get_product(db, item.product_id)
        if product is None:
            raise HTTPException(
                status_code=422,
                detail=f"Product with id={item.product_id} does not exist",
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Insufficient stock for '{product.name}' "
                    f"(available: {product.stock_quantity}, requested: {item.quantity})"
                ),
            )
        validated.append((product, item.quantity))

    # ── All validations passed → one transaction ──────────────────────────
    try:
        total = sum(p.price * qty for p, qty in validated)
        order = models.Order(
            order_reference=_generate_order_reference(),
            status="PLACED",
            total_amount=total,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(order)
        db.flush()  # get order.id

        for product, qty in validated:
            db.add(
                models.OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name_snapshot=product.name,
                    quantity=qty,
                    unit_price=product.price,
                    line_total=product.price * qty,
                )
            )
            # Atomic decrement
            db.execute(
                update(models.Product)
                .where(models.Product.id == product.id)
                .values(stock_quantity=models.Product.stock_quantity - qty)
            )

        db.add(
            models.OrderStatusHistory(
                order_id=order.id,
                from_status=None,
                to_status="PLACED",
                changed_at=utc_now(),
                notes="Order created",
            )
        )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create order")

    db.refresh(order)
    return order


def list_orders(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[models.Order]:
    stmt = (
        select(models.Order)
        .options(
            selectinload(models.Order.items),
            selectinload(models.Order.status_history),
        )
    )
    if search:
        stmt = stmt.where(models.Order.order_reference.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(models.Order.status == status.upper())
    stmt = stmt.order_by(models.Order.created_at.desc()).offset(skip).limit(limit)
    return db.execute(stmt).scalars().all()


def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.execute(
        select(models.Order)
        .options(
            selectinload(models.Order.items),
            selectinload(models.Order.status_history),
        )
        .where(models.Order.id == order_id)
    ).scalar_one_or_none()


def get_order_by_reference(db: Session, reference: str) -> Optional[models.Order]:
    return db.execute(
        select(models.Order)
        .options(
            selectinload(models.Order.items),
            selectinload(models.Order.status_history),
        )
        .where(models.Order.order_reference == reference)
    ).scalar_one_or_none()


def update_order_status(
    db: Session, order: models.Order, new_status: str
) -> models.Order:
    new_status = new_status.upper()
    allowed = VALID_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Cannot transition order from {order.status} to {new_status}. "
                f"Valid transitions: {allowed or 'none'}"
            ),
        )

    old_status = order.status
    try:
        order.status = new_status
        order.updated_at = utc_now()
        db.add(
            models.OrderStatusHistory(
                order_id=order.id,
                from_status=old_status,
                to_status=new_status,
                changed_at=utc_now(),
            )
        )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update order status")

    db.refresh(order)
    return order


def cancel_order(db: Session, order: models.Order) -> models.Order:
    if order.status == "CANCELLED":
        raise HTTPException(status_code=409, detail="Order is already cancelled")
    if order.status not in ("PLACED", "PACKED"):
        raise HTTPException(
            status_code=422,
            detail=f"Cannot cancel order in status {order.status}",
        )

    old_status = order.status
    try:
        order.status = "CANCELLED"
        order.cancelled_at = utc_now()
        order.updated_at = utc_now()

        # Restore stock for all items
        for item in order.items:
            db.execute(
                update(models.Product)
                .where(models.Product.id == item.product_id)
                .values(stock_quantity=models.Product.stock_quantity + item.quantity)
            )

        db.add(
            models.OrderStatusHistory(
                order_id=order.id,
                from_status=old_status,
                to_status="CANCELLED",
                changed_at=utc_now(),
                notes="Order cancelled, stock restored",
            )
        )
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to cancel order")

    db.refresh(order)
    return order


# ─── Dashboard ───────────────────────────────────────────────────────────────

def get_dashboard_stats(db: Session) -> dict:
    # Order counts by status
    status_counts = {
        row.status: row.count
        for row in db.execute(
            select(models.Order.status, func.count(models.Order.id).label("count"))
            .group_by(models.Order.status)
        ).all()
    }

    total_orders = sum(status_counts.values())
    total_inventory = db.execute(
        select(func.sum(models.Product.stock_quantity))
    ).scalar() or 0

    low_stock = db.execute(
        select(models.Product).where(models.Product.stock_quantity < 5)
    ).scalars().all()

    recent_orders = db.execute(
        select(models.Order)
        .options(
            selectinload(models.Order.items),
            selectinload(models.Order.status_history),
        )
        .order_by(models.Order.created_at.desc())
        .limit(5)
    ).scalars().all()

    recent_activity = db.execute(
        select(models.OrderStatusHistory)
        .options(selectinload(models.OrderStatusHistory.order))
        .order_by(models.OrderStatusHistory.changed_at.desc())
        .limit(10)
    ).scalars().all()

    return {
        "total_orders": total_orders,
        "placed": status_counts.get("PLACED", 0),
        "packed": status_counts.get("PACKED", 0),
        "shipped": status_counts.get("SHIPPED", 0),
        "cancelled": status_counts.get("CANCELLED", 0),
        "total_inventory": total_inventory,
        "low_stock_products": low_stock,
        "recent_orders": recent_orders,
        "recent_activity": recent_activity,
    }


# ─── Seed data ───────────────────────────────────────────────────────────────

SEED_PRODUCTS = [
    {"name": "Wireless Headphones", "sku": "WH-001", "price": 2499.0, "stock_quantity": 15, "category": "Electronics"},
    {"name": "Mechanical Keyboard", "sku": "MK-002", "price": 3999.0, "stock_quantity": 10, "category": "Peripherals"},
    {"name": "Gaming Mouse",        "sku": "GM-003", "price": 1499.0, "stock_quantity": 20, "category": "Peripherals"},
    {"name": "USB-C Hub",           "sku": "UC-004", "price": 1999.0, "stock_quantity": 8,  "category": "Accessories"},
    {"name": "Laptop Stand",        "sku": "LS-005", "price": 1299.0, "stock_quantity": 12, "category": "Accessories"},
    {"name": "Bluetooth Speaker",   "sku": "BS-006", "price": 2999.0, "stock_quantity": 0,  "category": "Audio"},
]


def seed_products(db: Session) -> None:
    count = db.execute(select(func.count(models.Product.id))).scalar()
    if count and count > 0:
        return
    for p in SEED_PRODUCTS:
        db.add(models.Product(**p, created_at=utc_now()))
    db.commit()
