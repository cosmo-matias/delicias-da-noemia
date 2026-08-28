import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { db } from "../../db/client";
import { compras } from "../../db/schema";
import { desc } from "drizzle-orm";
import type { Compra } from "../../db/schema";

export default function PurchasesListScreen() {
  const router = useRouter();
  const [purchaseList, setPurchaseList] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPurchases = useCallback(async () => {
    try {
      const result = await db
        .select()
        .from(compras)
        .orderBy(desc(compras.data));
      setPurchaseList(result);
    } catch (err) {
      console.error("Erro ao carregar compras:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarrega ao voltar para esta tela
  useFocusEffect(
    useCallback(() => {
      loadPurchases();
    }, [loadPurchases])
  );

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 pt-20">
      <Text className="text-5xl">🛒</Text>
      <Text className="mt-4 text-center text-lg font-semibold text-primary">
        Nenhuma compra registrada
      </Text>
      <Text className="mt-2 text-center text-sm text-secondary">
        Toque no botão abaixo para registrar sua primeira compra de insumos.
      </Text>
    </View>
  );

  const renderPurchaseItem = ({ item }: { item: Compra }) => (
    <Pressable
      onPress={() => router.push(`/purchases/${item.id}`)}
      className="mb-3 rounded-xl border border-secondary/20 bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-base font-semibold text-primary">
            {formatDate(item.data)}
          </Text>
          {item.observacoes ? (
            <Text className="mt-1 text-sm text-secondary" numberOfLines={1}>
              {item.observacoes}
            </Text>
          ) : null}
        </View>
        <Text className="text-lg font-bold text-primary">
          {formatCurrency(item.valorTotal)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background px-5 pt-4">
      {/* Header com total */}
      {purchaseList.length > 0 && (
        <View className="mb-4 rounded-xl bg-primary p-4">
          <Text className="text-sm text-secondary">Total em compras</Text>
          <Text className="text-2xl font-bold text-white">
            {formatCurrency(
              purchaseList.reduce((sum, p) => sum + p.valorTotal, 0)
            )}
          </Text>
          <Text className="mt-1 text-xs text-secondary">
            {purchaseList.length}{" "}
            {purchaseList.length === 1 ? "compra" : "compras"} registrada
            {purchaseList.length === 1 ? "" : "s"}
          </Text>
        </View>
      )}

      {/* Lista */}
      <FlatList
        data={purchaseList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPurchaseItem}
        ListEmptyComponent={loading ? null : renderEmptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB — Nova Compra */}
      <Pressable
        onPress={() => router.push("/purchases/new")}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Text className="text-2xl text-white">+</Text>
      </Pressable>
    </View>
  );
}
