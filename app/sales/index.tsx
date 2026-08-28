import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { db } from "../../db/client";
import { sales, saleItems } from "../../db/schema";
import { desc, eq, sum } from "drizzle-orm";
import type { Sale } from "../../db/schema";

type SaleWithItems = Sale & { itemsCount: number };

export default function SalesListScreen() {
  const router = useRouter();
  const [salesList, setSalesList] = useState<SaleWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    try {
      const allSales = await db
        .select()
        .from(sales)
        .orderBy(desc(sales.date), desc(sales.createdAt));

      const withCounts: SaleWithItems[] = await Promise.all(
        allSales.map(async (sale) => {
          const [result] = await db
            .select({ count: sum(saleItems.quantity) })
            .from(saleItems)
            .where(eq(saleItems.saleId, sale.id));
          return { ...sale, itemsCount: Number(result?.count ?? 0) };
        })
      );

      setSalesList(withCounts);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, [loadSales])
  );

  const formatCurrency = (val: number) =>
    `R$ ${val.toFixed(2).replace(".", ",")}`;

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 pt-20">
      <Text className="text-5xl">💰</Text>
      <Text className="mt-4 text-center text-lg font-semibold text-primary">
        Nenhuma venda registrada
      </Text>
      <Text className="mt-2 text-center text-sm text-secondary">
        Faça seu primeiro fechamento de caixa tocando no botão abaixo.
      </Text>
    </View>
  );

  const renderSaleItem = ({ item }: { item: SaleWithItems }) => {
    const [year, month, day] = item.date.split("-");
    
    return (
      <Pressable className="mb-3 rounded-xl border border-secondary/20 bg-white p-4 active:opacity-80">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-semibold text-primary">
              Fechamento: {day}/{month}/{year}
            </Text>
            <View className="mt-1 flex-row items-center gap-3">
              <Text className="text-sm font-bold text-green-700">
                {formatCurrency(item.totalAmount)}
              </Text>
              <Text className="text-sm text-secondary">
                {item.itemsCount} {item.itemsCount === 1 ? "item vendido" : "itens vendidos"}
              </Text>
            </View>
            {item.discount > 0 && (
              <Text className="mt-1 text-xs text-secondary">
                Descontos: {formatCurrency(item.discount)}
              </Text>
            )}
            {item.notes ? (
              <Text className="mt-1 text-xs text-secondary/70" numberOfLines={1}>
                {item.notes}
              </Text>
            ) : null}
          </View>
          <Text className="text-xl text-secondary">›</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-background px-5 pt-4">
      {salesList.length > 0 && (
        <View className="mb-4 rounded-xl bg-primary p-4">
          <Text className="text-sm text-secondary">Histórico de Fechamentos</Text>
          <Text className="text-2xl font-bold text-white">
            {salesList.length} {salesList.length === 1 ? "registro" : "registros"}
          </Text>
        </View>
      )}

      <FlatList
        data={salesList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSaleItem}
        ListEmptyComponent={loading ? null : renderEmptyState}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={() => router.push("/sales/new")}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
      >
        <Text className="text-2xl text-white">+</Text>
      </Pressable>
    </View>
  );
}
