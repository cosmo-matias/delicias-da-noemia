import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Delícias da Noêmia — Database Schema
 *
 * Tabelas:
 * - ingredients: Insumos base da confeitaria
 * - purchases: Compras agrupadas por data
 * - purchase_items: Itens individuais de cada compra
 */

// ─── Ingredients (Insumos) ───────────────────────────────────────────

export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  defaultUnit: text("default_unit", {
    enum: ["kg", "g", "L", "ml", "un"],
  }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  purchaseItems: many(purchaseItems),
}));

// ─── Purchases (Compras) ─────────────────────────────────────────────

export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // ISO date string (YYYY-MM-DD)
  totalAmount: real("total_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const purchasesRelations = relations(purchases, ({ many }) => ({
  items: many(purchaseItems),
}));

// ─── Purchase Items (Itens da Compra) ────────────────────────────────

export const purchaseItems = sqliteTable("purchase_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseId: integer("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  brand: text("brand"),
  quantity: real("quantity").notNull(),
  unit: text("unit", {
    enum: ["kg", "g", "L", "ml", "un"],
  }).notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  ingredient: one(ingredients, {
    fields: [purchaseItems.ingredientId],
    references: [ingredients.id],
  }),
}));

// ─── Types ───────────────────────────────────────────────────────────

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;
