# FYND OPS — Commerce Order Management Console

**Fynd Hiring Hackathon — November 2026 | Full Stack Developer (SDE 1)**

FYND OPS is a web-based commerce operations console for managing products, inventory, customer orders and order fulfilment.

It provides a central place for operations teams to create orders, monitor stock, track order status and handle cancellations.

---

## Problem Statement

Commerce operations teams can face difficulties when orders and inventory are managed manually:

- Stock quantities may become inconsistent after multiple orders.
- Teams may lack visibility into order fulfilment status.
- Manual cancellation and stock restoration can introduce errors.
- Order changes may be difficult to trace.

## Solution

FYND OPS provides a centralized order management application with:

- Multi-product order creation.
- Server-side stock validation and deduction.
- Order fulfilment status management.
- Cancellation with inventory restoration.
- Order search and status filtering.
- Dashboard statistics and inventory visibility.
- Order status history for tracking changes.

## Features

| Feature | Description |
|---|---|
| Product catalogue | View available products, prices and stock |
| Order creation | Create orders containing multiple products |
| Stock validation | Reject orders when requested stock is unavailable |
| Transaction handling | Process order creation and stock deductions together |
| Duplicate item handling | Combine quantities for repeated product IDs |
| Order management | Search orders and filter by status |
| Fulfilment workflow | Move orders from PLACED to PACKED to SHIPPED |
| Cancellation | Cancel eligible orders and restore stock |
| Status history | Record order status changes |
| Dashboard | View order statistics and inventory information |
| Persistence | Store application data in SQLite |

## Order Workflow

```text
                 Create Order
                      |
                      v
                   PLACED
                      |
                      v
                   PACKED
                      |
                      v
                   SHIPPED
```

Cancellation is allowed only from PLACED or PACKED.

```text
PLACED ---------> CANCELLED
PACKED ---------> CANCELLED

SHIPPED --------> Cancellation not allowed
```

The backend validates transitions. Invalid transitions are rejected.

When an order is cancelled successfully, its stock is restored as part of the cancellation transaction. Repeated cancellation requests are rejected.

## Inventory and Order Safety

Order creation follows these steps:

1. Validate that the order contains at least one item.
2. Combine quantities for repeated product IDs.
3. Check that every requested product exists.
4. Validate the combined requested quantity against available stock.
5. Create the order and its item records.
6. Deduct stock using conditional database updates.
7. Commit the transaction.

If a requested item cannot be fulfilled, the order is rejected and the transaction is rolled back.

The implementation includes conditional stock updates and stale-status protection. The automated tests cover these business rules, but a dedicated high-concurrency stress test has not yet been performed.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| API communication | Axios |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy 2.x |
| Validation | Pydantic 2 |
| Database | SQLite |
| Testing | Pytest, FastAPI TestClient |
| Frontend deployment configuration | Vercel |
| Backend deployment configuration | Render |

## Architecture

```text
Browser
  |
  v
React + TypeScript Frontend
  |
  | HTTP / JSON
  v
FastAPI Backend
  |
  +-- Health Router
  |
  +-- Products Router
  |
  +-- Orders Router
  |
  +-- Dashboard Router
  |
  v
CRUD / Business Logic
  |
  v
SQLAlchemy ORM
  |
  v
SQLite Database
  |
  +-- Products
  +-- Orders
  +-- Order Items
  +-- Order Status History
```

## Database Design

### Products

Stores product catalogue and inventory information.

| Field | Description |
|---|---|
| id | Product identifier |
| name | Product name |
| sku | Unique stock-keeping unit |
| description | Optional product description |
| price | Product price |
| stock_quantity | Available stock |
| category | Product category |
| created_at | Creation timestamp |

### Orders

Stores order-level information.

| Field | Description |
|---|---|
| id | Order identifier |
| order_reference | Unique order reference |
| status | Current order status |
| total_amount | Total order value |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |
| cancelled_at | Cancellation timestamp, if applicable |

### Order Items

Stores the products belonging to each order.

| Field | Description |
|---|---|
| id | Order item identifier |
| order_id | Related order |
| product_id | Related product |
| product_name_snapshot | Product name at order time |
| quantity | Ordered quantity |
| unit_price | Price at order time |
| line_total | Quantity multiplied by unit price |

### Order Status History

Stores changes to an order's fulfilment status.

| Field | Description |
|---|---|
| id | History record identifier |
| order_id | Related order |
| from_status | Previous status |
| to_status | New status |
| changed_at | Change timestamp |
| notes | Optional notes |

## API Documentation

Interactive API documentation is available through FastAPI Swagger UI at `/docs`.

### Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend health |

### Products

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/products` | List products |
| GET | `/api/products/{product_id}` | Get product details |

### Orders

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/orders` | Create an order |
| GET | `/api/orders` | List and filter orders |
| GET | `/api/orders/{order_id}` | Get order details |
| GET | `/api/orders/reference/{reference}` | Find order by reference |
| PATCH | `/api/orders/{order_id}/status` | Update fulfilment status |
| POST | `/api/orders/{order_id}/cancel` | Cancel an eligible order |

### Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard/stats` | Retrieve dashboard statistics |

### Example: Create an Order

Request:

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

The backend validates all requested products and quantities before committing the order.

### Example: Update Order Status

Request:

```json
{
  "status": "PACKED"
}
```

Only the supported fulfilment transitions are accepted. Cancellation is handled through its separate endpoint.

## Sample Catalogue

The application seeds a sample product catalogue when the backend starts and the catalogue is empty.

It includes:

- Wireless Headphones
- Mechanical Keyboard
- Gaming Mouse
- USB-C Hub
- Laptop Stand
- Bluetooth Speaker

The sample catalogue includes an out-of-stock product for validation scenarios.

## Local Setup

### Prerequisites

- Python 3.11 or later
- Node.js 18 or later
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Ibrahim3115/fynd-commerce-order-console.git
cd fynd-commerce-order-console
```

### 2. Start the backend

Open a terminal in the project directory:

```powershell
cd backend

python -m venv venv
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt

Copy-Item .env.example .env

python -m uvicorn app.main:app --reload --port 8000
```

The backend runs at:

- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

The default database is SQLite. The application creates its tables and seeds the sample catalogue on startup.

### 3. Start the frontend

Open a second terminal:

```powershell
cd frontend

npm install
Copy-Item .env.example .env

npm run dev
```

The frontend runs at:

http://localhost:5173

The frontend environment variable is:

```env
VITE_API_URL=http://localhost:8000
```

## Automated Tests

The backend uses Pytest and FastAPI TestClient.

Run the tests from the backend directory:

```powershell
python -m pytest -q
```

The current automated suite contains **21 tests** covering:

- Successful order creation.
- Insufficient-stock rejection.
- Multi-product order details.
- Duplicate product quantity handling.
- Prevention of overselling through duplicate order items.
- Invalid fulfilment transitions.
- Valid fulfilment transitions.
- Cancellation and stock restoration.
- Repeated cancellation rejection.
- Cancellation restrictions for shipped orders.
- Order status history.
- Invalid quantities and product IDs.
- Unsupported status values.
- Dashboard and health endpoints.
- Database persistence across restart.
- Stale order status update conflicts.

Latest verified result:

```text
21 passed
```

## Environment Variables

### Backend

File: `backend/.env`

| Variable | Default | Purpose |
|---|---|---|
| DATABASE_URL | `sqlite:///./fynd_ops.db` | Database connection |
| CORS_ORIGINS | `*` | Allowed frontend origins |

### Frontend

File: `frontend/.env`

| Variable | Example | Purpose |
|---|---|---|
| VITE_API_URL | `http://localhost:8000` | Backend API base URL |

Do not commit private environment files or credentials.

## Deployment Configuration

The repository includes configuration files for deploying the frontend and backend.

### Frontend — Vercel

The `vercel.json` file configures the frontend build and SPA routing.

Set the `VITE_API_URL` environment variable to the deployed backend URL before building.

### Backend — Render

The `render.yaml` file configures:

- Python backend build command.
- Uvicorn start command.
- Backend environment variables.
- A persistent disk for the SQLite database.

Update `CORS_ORIGINS` to the actual frontend domain when deploying.

The included files provide deployment configuration; successful deployment should be verified separately.

For a larger production workload, PostgreSQL, database migrations, authentication, role-based access control and production monitoring should be added and tested.

## Project Structure

```text
Fynd-Commerce-Console/
|
+-- backend/
|   |
|   +-- app/
|   |   |
|   |   +-- main.py
|   |   +-- config.py
|   |   +-- database.py
|   |   +-- models.py
|   |   +-- schemas.py
|   |   +-- crud.py
|   |   |
|   |   +-- routers/
|   |       +-- health.py
|   |       +-- products.py
|   |       +-- orders.py
|   |       +-- fulfilment.py  (placeholder; transitions are handled by orders.py)
|   |       +-- dashboard.py
|   |
|   +-- tests/
|   |   +-- conftest.py
|   |   +-- test_orders.py
|   |   +-- verify_workflow.py
|   |
|   +-- requirements.txt
|   +-- .env.example
|
+-- frontend/
|   |
|   +-- src/
|   +-- package.json
|   +-- .env.example
|   +-- .env.production.example
|
+-- README.md
+-- .gitignore
+-- render.yaml
+-- vercel.json
```

## Future Improvements

- Authentication and role-based permissions.
- PostgreSQL with Alembic migrations.
- Product creation and editing.
- Pagination and advanced reporting.
- Dedicated concurrency and load testing.
- Production logging and monitoring.
- Integration with external fulfilment services.

## License

MIT License
