import { db } from "./client";
import { ingredients, purchases, purchaseItems } from "./schema";
import { sql } from "drizzle-orm";

/**
 * Cria as tabelas no banco de dados caso não existam.
 * Chamado na inicialização do app.
 */
export async function initDatabase() {
  const database = db.$client;

  database.execSync(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      default_unit TEXT NOT NULL CHECK(default_unit IN ('kg', 'g', 'L', 'ml', 'un')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
      brand TEXT,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL CHECK(unit IN ('kg', 'g', 'L', 'ml', 'un')),
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );
  `);
}
