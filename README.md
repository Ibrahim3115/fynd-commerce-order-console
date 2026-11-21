# FYND OPS — Commerce Operations Command Center

> **Fynd Hiring Hackathon — November 2026 | Full Stack (SDE 1)**

---

## Problem Statement

Small and mid-size commerce businesses often manage orders through a chaotic mix of **spreadsheets, WhatsApp messages, and phone calls**. This leads to:

- Overselling products when multiple operators take orders simultaneously
- No visibility into order fulfilment state across the team
- Manual, error-prone stock counting after every sale
- Zero audit trail for order changes or cancellations

The result is frustrated customers, lost revenue, and burnt-out operations staff.

---

## Solution

**FYND OPS** is a lightweight, real-time **Commerce Operations Command Center** that replaces the spreadsheet+phone chaos with a single web application:

- One operator (or many simultaneously) can **create multi-product orders** with the confidence that stock is atomically deducted — no double-selling, ever.
- Orders move through a clear **fulfilment state machine** (PLACED → PACKED → SHIPPED) so the whole team knows where every order stands.
- Cancellations are instant and **automatically restore inventory**.
- A live **dashboard** gives management a bird's-eye view of orders, inventory, and low-stock alerts.

---

## Features

| # | Feature | Status |
|---|---------|--------|
| 1 | Real-time inventory management | ✅ |
| 2 | Multi-product order creation with atomic stock deduction | ✅ |
| 3 | Fulfilment state machine (PLACED → PACKED → SHIPPED) | ✅ |
| 4 | Order cancellation with stock restoration | ✅ |
| 5 | Transaction-safe concurrent order processing | ✅ |
| 6 | Full-text order search and status filtering | ✅ |
| 7 | Dashboard with live stats & low-stock alerts | ✅ |
| 8 | Automated pytest test suite (12 tests) | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Recharts |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.x |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Testing** | Pytest, FastAPI TestClient |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│               Browser (React SPA)               │
│  Dashboard │ Inventory │ Orders │ New Order UI  │
└─────────────────────┬───────────────────────────┘
                      │  HTTP/JSON (REST)
                      ▼
┌─────────────────────────────────────────────────┐
│            FastAPI Application Server           │
│  /api/products  /api/orders  /api/dashboard     │
│  /api/fulfilment  /health                       │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Products │  │  Orders  │  │  Dashboard    │ │
│  │  Router  │  │  Router  │  │  Router       │ │
│  └──────────┘  └────┬─────┘  └───────────────┘ │
│                     │                           │
│         ┌───────────▼──────────┐                │
│         │  Business Logic /    │                │
│         │  CRUD Layer          │                │
│         └───────────┬──────────┘                │
│                     │ SQLAlchemy 2.x             │
└─────────────────────┼───────────────────────────┘
                      │
         ┌────────────▼────────────┐
         │   SQLite (dev)          │
         │   PostgreSQL (prod)     │
         └─────────────────────────┘
```

---

## Database Design

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | Auto-increment |
| name | String | Product display name |
| sku | String (unique) | Stock-Keeping Unit |
| description | Text | Optional description |
| price | Float | Unit price (INR) |
| stock_quantity | Integer | Current available stock |
| category | String | Product category |
| created_at | DateTime | Auto-set on creation |

### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | Auto-increment |
| order_reference | String (unique, indexed) | Format: `ORD-YYYYMMDD-XXXXXX` |
| status | String | PLACED / PACKED / SHIPPED / CANCELLED |
| total_amount | Float | Sum of all line totals |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Updated on every status change |
| cancelled_at | DateTime (nullable) | Set on cancellation |

### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | Auto-increment |
| order_id | Integer FK → orders.id | Cascade delete |
| product_id | Integer FK → products.id | Reference |
| product_name_snapshot | String | Name at time of order (preserved even if product is renamed) |
| quantity | Integer | Ordered quantity |
| unit_price | Float | Price at time of order |
| line_total | Float | quantity × unit_price |

### `order_status_history`
| Column | Type | Notes |
|--------|------|-------|
| id | Integer PK | Auto-increment |
| order_id | Integer FK → orders.id | Cascade |
| from_status | String (nullable) | Previous status (null on creation) |
| to_status | String | New status |
| changed_at | DateTime | Auto-set |
| notes | String (nullable) | Optional human note |

---

## Order State Machine

```
                  ┌─────────┐
        create    │  PLACED │
   ─────────────► │         │
                  └────┬────┘
                       │  PATCH /status → PACKED
                       ▼
                  ┌─────────┐
                  │ PACKED  │
                  └────┬────┘
                       │  PATCH /status → SHIPPED
                       ▼
                  ┌─────────┐
                  │ SHIPPED │  (terminal)
                  └─────────┘

PLACED  ──► CANCELLED  (stock restored)
PACKED  ──► CANCELLED  (stock restored)
SHIPPED ──► CANCELLED  ✗  not allowed
```

**Invalid transitions return HTTP 422** with a clear human-readable message.

---

## API Documentation

### Health

#### `GET /health`
Returns server status.

**Response:**
```json
{ "status": "ok", "service": "FYND OPS Backend" }
```

---

### Products

#### `GET /api/products`
List all products with current stock levels.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Wireless Headphones",
    "sku": "WH-001",
    "price": 2499.0,
    "stock_quantity": 15,
    "category": "Electronics",
    "description": null,
    "created_at": "2026-11-21T10:00:00"
  }
]
```

#### `GET /api/products/{id}`
Get a single product by ID.

**Response:** Same shape as above, or `404` if not found.

---

### Orders

#### `POST /api/orders`
Create a new order. Atomically validates all items and deducts stock in a single transaction.

**Request body:**
```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

**Success (201):**
```json
{
  "id": 42,
  "order_reference": "ORD-20261121-A3F9KL",
  "status": "PLACED",
  "total_amount": 6497.0,
  "items": [
    {
      "product_id": 1,
      "product_name_snapshot": "Wireless Headphones",
      "quantity": 2,
      "unit_price": 2499.0,
      "line_total": 4998.0
    },
    {
      "product_id": 3,
      "product_name_snapshot": "Gaming Mouse",
      "quantity": 1,
      "unit_price": 1499.0,
      "line_total": 1499.0
    }
  ],
  "created_at": "2026-11-21T10:05:00",
  "updated_at": "2026-11-21T10:05:00",
  "cancelled_at": null
}
```

**Error (422) — insufficient stock:**
```json
{ "detail": "Insufficient stock for 'Wireless Headphones'. Available: 1, Requested: 2" }
```

#### `GET /api/orders`
List orders with optional search and filtering.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Full-text search on order_reference |
| status | string | Filter by status (PLACED/PACKED/SHIPPED/CANCELLED) |
| skip | int | Pagination offset (default 0) |
| limit | int | Page size (default 50, max 200) |

#### `GET /api/orders/{id}`
Get a single order by numeric ID, including items and status history.

#### `GET /api/orders/reference/{reference}`
Get a single order by its `ORD-YYYYMMDD-XXXXXX` reference string.

#### `PATCH /api/orders/{id}/status`
Advance order through the state machine.

**Request body:**
```json
{ "status": "PACKED" }
```

**Error (422) — invalid transition:**
```json
{ "detail": "Cannot transition from SHIPPED to PLACED. Valid transitions: none (terminal state)." }
```

#### `POST /api/orders/{id}/cancel`
Cancel an order (PLACED or PACKED only). Restores all stock atomically.

**Success (200):** Returns updated order object with `status: "CANCELLED"`.

**Error (409) — already cancelled:**
```json
{ "detail": "Order ORD-20261121-A3F9KL is already CANCELLED." }
```

---

### Dashboard

#### `GET /api/dashboard/stats`
Aggregate statistics for the operations dashboard.

**Response:**
```json
{
  "total_orders": 24,
  "placed": 5,
  "packed": 3,
  "shipped": 14,
  "cancelled": 2,
  "total_inventory": 487,
  "low_stock_products": [
    { "id": 4, "name": "USB-C Hub", "sku": "UC-004", "stock_quantity": 2 }
  ],
  "recent_orders": [ "...last 5 orders..." ],
  "recent_activity": [ "...last 10 status history entries..." ]
}
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

---

### Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtualenv:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

uvicorn app.main:app --reload --port 8000
```

API docs available at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env     # or create with: echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

Frontend runs at **http://localhost:5173** by default.

---

### Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

Expected output: **12 passed** covering order creation, state machine transitions, cancellation, stock restoration, and concurrent safety.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./fynd_ops.db` | Database connection string |
| `CORS_ORIGINS` | `*` | Allowed origins (comma-separated) |

### Frontend (`frontend/.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

---

## Deployment

### Frontend — Vercel

1. Push repo to GitHub.
2. Import repo in [vercel.com](https://vercel.com).
3. Vercel auto-detects `vercel.json` — no manual config needed.
4. Add environment variable `VITE_API_URL` → your Render backend URL.
5. Click **Deploy**.

The included [`vercel.json`](vercel.json) handles SPA routing (all paths → `index.html`).

### Backend — Render

1. Create a **Web Service** in [render.com](https://render.com), pointing at the same repo.
2. The included [`render.yaml`](render.yaml) configures:
   - Build: `cd backend && pip install -r requirements.txt`
   - Start: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - A **1 GB persistent disk** mounted at `/data` for the SQLite database
3. Add environment variable `CORS_ORIGINS` → your Vercel frontend URL.
4. Click **Deploy**.

> **Note:** For production scale, replace SQLite with PostgreSQL by changing `DATABASE_URL` to a Postgres connection string — no code changes required, SQLAlchemy handles both.

---

## Screenshots

> Add screenshots to `/screenshots` directory after running the application locally.

Suggested screenshots:
- Dashboard overview
- New order form with multi-item selection
- Order list with search/filter
- Order detail with status history timeline
- Inventory table with low-stock highlights

---

## Project Structure

```
Fynd-Commerce-Console/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, lifespan, middleware
│   │   ├── config.py        # Pydantic settings
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── crud.py          # Business logic & DB operations
│   │   └── routers/
│   │       ├── products.py
│   │       ├── orders.py
│   │       ├── fulfilment.py
│   │       ├── dashboard.py
│   │       └── health.py
│   ├── tests/
│   │   └── test_orders.py   # 12-test pytest suite
│   ├── requirements.txt
│   ├── .env.example
│   └── start.sh
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── .env.example
├── README.md
├── .gitignore
├── render.yaml
└── vercel.json
```

---

## License

MIT © 2026 FYND OPS Team
