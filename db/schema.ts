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
  products: many(products),
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

// ─── Products (Produtos) ─────────────────────────────────────────────

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "restrict" }),
  salePrice: real("sale_price").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [products.recipeId],
    references: [recipes.id],
  }),
  saleItems: many(saleItems),
}));

// ─── Sales (Vendas/Fechamento) ───────────────────────────────────────

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // ISO date string
  discount: real("discount").notNull().default(0),
  totalAmount: real("total_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const salesRelations = relations(sales, ({ many }) => ({
  items: many(saleItems),
}));

// ─── Sale Items (Itens da Venda) ─────────────────────────────────────

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

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

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;

// ─── Refatoração/Melhorias: Módulo de Compras (Português) ────────────

export const insumos = sqliteTable("insumos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  marca: text("marca"),
  unidadeMedida: text("unidade_medida").notNull(),
  quantidadeMedida: real("quantidade_medida"),
  itensPorPacote: integer("itens_por_pacote"),
});

export const compras = sqliteTable("compras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  data: text("data").notNull(),
  valorTotal: real("valor_total").notNull().default(0),
  custosExtras: real("custos_extras").notNull().default(0),
  observacoes: text("observacoes"),
});

export const comprasItens = sqliteTable("compras_itens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  compraId: integer("compra_id").notNull().references(() => compras.id, { onDelete: "cascade" }),
  insumoId: integer("insumo_id").notNull().references(() => insumos.id, { onDelete: "restrict" }),
  quantidade: real("quantidade").notNull(),
  precoUnitario: real("preco_unitario").notNull(),
  precoTotal: real("preco_total").notNull(),
});

export const insumosRelations = relations(insumos, ({ many }) => ({
  comprasItens: many(comprasItens),
  receitasInsumos: many(receitasInsumos),
}));

export const comprasRelations = relations(compras, ({ many }) => ({
  itens: many(comprasItens),
}));

export const comprasItensRelations = relations(comprasItens, ({ one }) => ({
  compra: one(compras, {
    fields: [comprasItens.compraId],
    references: [compras.id],
  }),
  insumo: one(insumos, {
    fields: [comprasItens.insumoId],
    references: [insumos.id],
  }),
}));

export type Insumo = typeof insumos.$inferSelect;
export type Compra = typeof compras.$inferSelect;
export type CompraItem = typeof comprasItens.$inferSelect;

// ─── Receitas (Português) ────────────────────────────────────────────

export const receitas = sqliteTable("receitas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  rendimento: real("rendimento").notNull().default(1),
  custoAdicional: real("custo_adicional").notNull().default(0),
  observacoes: text("observacoes"),
});

export const receitasInsumos = sqliteTable("receitas_insumos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  receitaId: integer("receita_id").notNull().references(() => receitas.id, { onDelete: "cascade" }),
  insumoId: integer("insumo_id").notNull().references(() => insumos.id, { onDelete: "restrict" }),
  quantidadeUtilizada: real("quantidade_utilizada").notNull(),
});

export const receitasRelations = relations(receitas, ({ many }) => ({
  insumos: many(receitasInsumos),
}));

export const receitasInsumosRelations = relations(receitasInsumos, ({ one }) => ({
  receita: one(receitas, {
    fields: [receitasInsumos.receitaId],
    references: [receitas.id],
  }),
  insumo: one(insumos, {
    fields: [receitasInsumos.insumoId],
    references: [insumos.id],
  }),
}));

export type Receita = typeof receitas.$inferSelect;
export type ReceitaInsumo = typeof receitasInsumos.$inferSelect;

// ─── Produtos (Português) ────────────────────────────────────────────

export const produtos = sqliteTable("produtos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  receitaId: integer("receita_id").references(() => receitas.id, { onDelete: "restrict" }),
  precoVenda: real("preco_venda").notNull(),
  observacoes: text("observacoes"),
});

export const produtosRelations = relations(produtos, ({ one, many }) => ({
  receita: one(receitas, {
    fields: [produtos.receitaId],
    references: [receitas.id],
  }),
  vendasItens: many(vendasItens),
}));

// ─── Vendas (Português) ──────────────────────────────────────────────

export const vendas = sqliteTable("vendas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  data: text("data").notNull(),
  valorTotal: real("valor_total").notNull().default(0),
  custosExtras: real("custos_extras").notNull().default(0),
  observacoes: text("observacoes"),
});

export const vendasItens = sqliteTable("vendas_itens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vendaId: integer("venda_id").notNull().references(() => vendas.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id").notNull().references(() => produtos.id, { onDelete: "restrict" }),
  quantidade: real("quantidade").notNull(),
  precoUnitario: real("preco_unitario").notNull(),
  precoTotal: real("preco_total").notNull(),
});

export const vendasRelations = relations(vendas, ({ many }) => ({
  itens: many(vendasItens),
}));

export const vendasItensRelations = relations(vendasItens, ({ one }) => ({
  venda: one(vendas, {
    fields: [vendasItens.vendaId],
    references: [vendas.id],
  }),
  produto: one(produtos, {
    fields: [vendasItens.produtoId],
    references: [produtos.id],
  }),
}));

export type Produto = typeof produtos.$inferSelect;
export type Venda = typeof vendas.$inferSelect;
export type VendaItem = typeof vendasItens.$inferSelect;
