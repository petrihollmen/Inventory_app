# Sailcraft Co. – Inventory Manager

A modern web application for managing the product inventory of **Sailcraft Co.**, a sailing boat retailer.

## Features

- **Browse** the full product catalogue (boats, sails, rigging, safety gear, navigation, accessories, maintenance)
- **Search** by name, SKU, or description and **filter** by category
- **Add** new products with name, SKU, category, price, quantity and description
- **Edit** any product inline via a modal form
- **Update quantity** directly from the table with − / + controls
- **Delete** products with a confirmation dialog
- Live **stats bar**: total products, total items in stock, low-stock alerts and total inventory value

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js + Express 5               |
| Database | SQLite via `better-sqlite3`       |
| Frontend | Vanilla HTML / CSS / JavaScript   |

## Getting Started

```bash
npm install
npm start
```

Then open <http://localhost:3000> in your browser.

The database is created automatically on first run and pre-populated with **20 sailing-related products** across 7 categories.
