from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    return crud.create_order(db, order_in)


@router.get("", response_model=List[schemas.OrderListOut])
def list_orders(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return crud.list_orders(db, search=search, status=status, skip=skip, limit=limit)


# IMPORTANT: /reference/{reference} MUST come before /{id}
@router.get("/reference/{reference}", response_model=schemas.OrderOut)
def get_order_by_reference(reference: str, db: Session = Depends(get_db)):
    order = crud.get_order_by_reference(db, reference)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{reference}' not found")
    return order


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    status_update: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return crud.update_order_status(db, order, status_update.status)


@router.post("/{order_id}/cancel", response_model=schemas.OrderOut)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return crud.cancel_order(db, order)
