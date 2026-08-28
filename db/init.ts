import { db } from "./client";

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

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      yield_quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL CHECK(unit IN ('kg', 'g', 'L', 'ml', 'un'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE RESTRICT,
      sale_price REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS insumos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      marca TEXT,
      unidade_medida TEXT NOT NULL,
      quantidade_medida REAL,
      itens_por_pacote INTEGER
    );

    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      valor_total REAL NOT NULL DEFAULT 0,
      custos_extras REAL NOT NULL DEFAULT 0,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS compras_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
      insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
      quantidade REAL NOT NULL,
      preco_unitario REAL NOT NULL,
      preco_total REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receitas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      rendimento REAL NOT NULL DEFAULT 1,
      custo_adicional REAL NOT NULL DEFAULT 0,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS receitas_insumos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receita_id INTEGER NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
      insumo_id INTEGER NOT NULL REFERENCES insumos(id) ON DELETE RESTRICT,
      quantidade_utilizada REAL NOT NULL
    );
  `);

  // Migrate existing `compras` table by adding `custos_extras` if it doesn't exist yet
  try {
    database.execSync("ALTER TABLE compras ADD COLUMN custos_extras REAL NOT NULL DEFAULT 0;");
  } catch (e) {
    // Ignore error if column already exists
  }
}
