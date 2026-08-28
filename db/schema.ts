import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/**
 * Delícias da Noêmia — Database Schema
 *
 * Tabelas:
 * - ingredients: Insumos base da confeitaria
 * - purchases: Compras agrupadas por data
 * - purchase_items: Itens individuais de cada compra
 * - recipes: Receitas (fichas técnicas)
 * - recipe_ingredients: Insumos usados em cada receita
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
  recipeIngredients: many(recipeIngredients),
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

// ─── Recipes (Receitas) ──────────────────────────────────────────────

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  yieldQuantity: integer("yield_quantity").notNull().default(1),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
}));

// ─── Recipe Ingredients (Ficha Técnica) ──────────────────────────────

export const recipeIngredients = sqliteTable("recipe_ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  quantity: real("quantity").notNull(),
  unit: text("unit", {
    enum: ["kg", "g", "L", "ml", "un"],
  }).notNull(),
});

export const recipeIngredientsRelations = relations(
  recipeIngredients,
  ({ one }) => ({
    recipe: one(recipes, {
      fields: [recipeIngredients.recipeId],
      references: [recipes.id],
    }),
    ingredient: one(ingredients, {
      fields: [recipeIngredients.ingredientId],
      references: [ingredients.id],
    }),
  })
);

// ─── Types ───────────────────────────────────────────────────────────

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

export type PurchaseItem = typeof purchaseItems.$inferSelect;
export type NewPurchaseItem = typeof purchaseItems.$inferInsert;

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;
