from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app import crud
from app.routers import health, products, orders, fulfilment, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed products if needed
    db = SessionLocal()
    try:
        crud.seed_products(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="FYND OPS – Commerce Order Console",
    description="Backend API for the FYND OPS hackathon project",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(fulfilment.router)
app.include_router(dashboard.router)
