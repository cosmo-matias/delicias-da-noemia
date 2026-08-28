import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { db } from "../../db/client";
import { products, recipes } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import type { Product, Recipe } from "../../db/schema";

type ProductWithRecipe = Product & { recipe: Recipe };

export default function ProductsListScreen() {
  const router = useRouter();
  const [productList, setProductList] = useState<ProductWithRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const allProducts = await db
        .select({
          product: products,
          recipe: recipes,
        })
        .from(products)
        .innerJoin(recipes, eq(products.recipeId, recipes.id))
        .orderBy(desc(products.createdAt));

      setProductList(
        allProducts.map((p) => ({
          ...p.product,
          recipe: p.recipe,
        }))
      );
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 pt-20">
      <Text className="text-5xl">🧁</Text>
      <Text className="mt-4 text-center text-lg font-semibold text-primary">
        Nenhum produto cadastrado
      </Text>
      <Text className="mt-2 text-center text-sm text-secondary">
        Cadastre um produto final a partir de uma receita para iniciar suas vendas.
      </Text>
    </View>
  );

  const renderProductItem = ({ item }: { item: ProductWithRecipe }) => (
    <Pressable className="mb-3 rounded-xl border border-secondary/20 bg-white p-4 active:opacity-80">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-primary">
            {item.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-3">
            <Text className="text-sm font-bold text-green-700">
              R$ {item.salePrice.toFixed(2).replace(".", ",")}
            </Text>
            <Text className="text-sm text-secondary">
              Receita: {item.recipe.name}
            </Text>
          </View>
        </View>
        <Text className="text-xl text-secondary">›</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background px-5 pt-4">
      {productList.length > 0 && (
        <View className="mb-4 rounded-xl bg-primary p-4">
          <Text className="text-sm text-secondary">Catálogo de Produtos</Text>
          <Text className="text-2xl font-bold text-white">
            {productList.length}{" "}
            {productList.length === 1 ? "produto" : "produtos"}
          </Text>
        </View>
      )}

      <FlatList
        data={productList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        ListEmptyComponent={loading ? null : renderEmptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => router.push("/products/new")}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Text className="text-2xl text-white">+</Text>
      </Pressable>
    </View>
  );
}
