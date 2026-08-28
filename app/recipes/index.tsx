import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { db } from "../../db/client";
import { recipes, recipeIngredients } from "../../db/schema";
import { desc, eq, count } from "drizzle-orm";
import type { Recipe } from "../../db/schema";

type RecipeWithCount = Recipe & { ingredientCount: number };

export default function RecipesListScreen() {
  const router = useRouter();
  const [recipeList, setRecipeList] = useState<RecipeWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = useCallback(async () => {
    try {
      // Busca receitas com contagem de ingredientes
      const allRecipes = await db
        .select()
        .from(recipes)
        .orderBy(desc(recipes.createdAt));

      const withCounts: RecipeWithCount[] = await Promise.all(
        allRecipes.map(async (recipe) => {
          const [result] = await db
            .select({ count: count() })
            .from(recipeIngredients)
            .where(eq(recipeIngredients.recipeId, recipe.id));
          return { ...recipe, ingredientCount: result?.count ?? 0 };
        })
      );

      setRecipeList(withCounts);
    } catch (err) {
      console.error("Erro ao carregar receitas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 pt-20">
      <Text className="text-5xl">📋</Text>
      <Text className="mt-4 text-center text-lg font-semibold text-primary">
        Nenhuma receita cadastrada
      </Text>
      <Text className="mt-2 text-center text-sm text-secondary">
        Toque no botão abaixo para criar sua primeira ficha técnica.
      </Text>
    </View>
  );

  const renderRecipeItem = ({ item }: { item: RecipeWithCount }) => (
    <Pressable className="mb-3 rounded-xl border border-secondary/20 bg-white p-4 active:opacity-80">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-primary">
            {item.name}
          </Text>
          <View className="mt-1 flex-row items-center gap-3">
            <Text className="text-sm text-secondary">
              🍰 Rende: {item.yieldQuantity} un
            </Text>
            <Text className="text-sm text-secondary">
              🧂 {item.ingredientCount}{" "}
              {item.ingredientCount === 1 ? "ingrediente" : "ingredientes"}
            </Text>
          </View>
          {item.notes ? (
            <Text
              className="mt-1 text-xs text-secondary/70"
              numberOfLines={1}
            >
              {item.notes}
            </Text>
          ) : null}
        </View>
        <Text className="text-xl text-secondary">›</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background px-5 pt-4">
      {/* Header com total */}
      {recipeList.length > 0 && (
        <View className="mb-4 rounded-xl bg-primary p-4">
          <Text className="text-sm text-secondary">Fichas técnicas</Text>
          <Text className="text-2xl font-bold text-white">
            {recipeList.length}{" "}
            {recipeList.length === 1 ? "receita" : "receitas"}
          </Text>
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={recipeList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecipeItem}
        ListEmptyComponent={loading ? null : renderEmptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB — Nova Receita */}
      <Pressable
        onPress={() => router.push("/recipes/new")}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Text className="text-2xl text-white">+</Text>
      </Pressable>
    </View>
  );
}
