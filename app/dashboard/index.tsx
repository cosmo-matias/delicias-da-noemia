import { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { db } from "../../db/client";
import { sales, purchases } from "../../db/schema";

type DashboardMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  salesVolume: number;
};

export default function DashboardScreen() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    salesVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Como o SQLite no Expo e o Drizzle não suportam sum() agrupado
      // perfeitamente de forma fácil sem queries brutas, faremos 
      // uma agregação na memória, o que é aceitável para o MVP.
      
      const allSales = await db.select().from(sales);
      const allPurchases = await db.select().from(purchases);

      // Faturamento (Sales)
      const totalRevenue = allSales.reduce((acc, sale) => acc + sale.totalAmount, 0);
      const salesVolume = allSales.length;

      // Despesas (Purchases)
      const totalExpenses = allPurchases.reduce((acc, purchase) => acc + purchase.totalAmount, 0);

      // Lucro Líquido
      const netProfit = totalRevenue - totalExpenses;

      setMetrics({
        totalRevenue,
        totalExpenses,
        netProfit,
        salesVolume,
      });
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMetrics();
    }, [loadMetrics])
  );

  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = `R$ ${absVal.toFixed(2).replace(".", ",")}`;
    return isNegative ? `- ${formatted}` : formatted;
  };

  const isProfitPositive = metrics.netProfit >= 0;

  return (
    <ScrollView 
      className="flex-1 bg-background px-5 pt-6"
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadMetrics} tintColor="#4A2B20" />
      }
    >
      <View className="mb-6">
        <Text className="text-2xl font-bold text-primary">Resumo Geral</Text>
        <Text className="text-sm text-secondary">
          Indicadores do seu negócio até o momento
        </Text>
      </View>

      {/* Lucro Líquido (Destaque) */}
      <View className={`mb-4 rounded-3xl p-6 shadow-sm ${isProfitPositive ? 'bg-primary' : 'bg-red-800'}`}>
        <Text className="text-base font-semibold text-white/80 mb-1">
          Lucro Líquido
        </Text>
        <Text className="text-4xl font-bold text-white mb-2">
          {formatCurrency(metrics.netProfit)}
        </Text>
        <Text className="text-sm text-white/70">
          {isProfitPositive 
            ? "O seu negócio está dando lucro!" 
            : "Atenção: As despesas superam o faturamento."}
        </Text>
      </View>

      <View className="flex-row gap-4 mb-4">
        {/* Faturamento */}
        <View className="flex-1 rounded-2xl bg-white border border-secondary/20 p-5 shadow-sm">
          <Text className="text-2xl mb-2">📈</Text>
          <Text className="text-sm font-medium text-secondary mb-1">Faturamento</Text>
          <Text className="text-xl font-bold text-green-700">
            {formatCurrency(metrics.totalRevenue)}
          </Text>
        </View>

        {/* Despesas */}
        <View className="flex-1 rounded-2xl bg-white border border-secondary/20 p-5 shadow-sm">
          <Text className="text-2xl mb-2">📉</Text>
          <Text className="text-sm font-medium text-secondary mb-1">Despesas</Text>
          <Text className="text-xl font-bold text-red-600">
            {formatCurrency(metrics.totalExpenses)}
          </Text>
        </View>
      </View>

      {/* Volume de Vendas */}
      <View className="mb-8 rounded-2xl bg-white border border-secondary/20 p-5 shadow-sm flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-medium text-secondary mb-1">Volume de Vendas</Text>
          <Text className="text-2xl font-bold text-primary">
            {metrics.salesVolume} {metrics.salesVolume === 1 ? "venda" : "vendas"}
          </Text>
        </View>
        <Text className="text-4xl">🛍️</Text>
      </View>

    </ScrollView>
  );
}
