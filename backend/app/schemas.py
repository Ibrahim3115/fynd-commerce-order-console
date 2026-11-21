from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, field_validator


# ─── Product ────────────────────────────────────────────────────────────────

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    category: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Order Item ──────────────────────────────────────────────────────────────

class OrderItemIn(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name_snapshot: str
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    line_total: float

    model_config = {"from_attributes": True}


# ─── Order Status History ────────────────────────────────────────────────────

class OrderStatusHistoryOut(BaseModel):
    id: int
    order_id: int
    order_reference: Optional[str] = None
    from_status: Optional[str] = None
    to_status: str
    changed_at: datetime
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Order ───────────────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    items: List[OrderItemIn]

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Order must contain at least one item")
        return v


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern="^(PACKED|SHIPPED)$")


class OrderOut(BaseModel):
    id: int
    order_reference: str
    status: str
    total_amount: float
    created_at: datetime
    updated_at: datetime
    cancelled_at: Optional[datetime] = None
    items: List[OrderItemOut] = Field(default_factory=list)
    status_history: List[OrderStatusHistoryOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class OrderListOut(BaseModel):
    id: int
    order_reference: str
    status: str
    total_amount: float
    created_at: datetime
    updated_at: datetime
    cancelled_at: Optional[datetime] = None
    items: List[OrderItemOut] = Field(default_factory=list)
    status_history: List[OrderStatusHistoryOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_orders: int
    placed: int
    packed: int
    shipped: int
    cancelled: int
    total_inventory: int
    low_stock_products: List[ProductOut]
    recent_orders: List[OrderListOut]
    recent_activity: List[OrderStatusHistoryOut]


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthOut(BaseModel):
    status: str
    timestamp: datetime
