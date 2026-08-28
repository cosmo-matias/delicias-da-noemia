import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { VendasRepository } from "../../db/repositories/vendas";
import { Feather } from "@expo/vector-icons";

export default function VendasScreen() {
  const router = useRouter();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Usando array invertido para mostrar as mais recentes primeiro
      const data = await VendasRepository.listarVendas();
      setVendas(data.reverse());
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/vendas/${item.id}`)}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm border border-secondary/20 active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          <View className="bg-primary/10 p-2 rounded-lg mr-3">
            <Feather name="shopping-bag" size={20} color="#4A2B20" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-secondary">
              Venda #{item.id}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(item.data)}
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-green-600">
          R$ {item.valorTotal.toFixed(2).replace(".", ",")}
        </Text>
      </View>
      {item.observacoes ? (
        <Text className="text-sm text-gray-600 mt-2" numberOfLines={1}>
          Obs: {item.observacoes}
        </Text>
      ) : null}
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background px-4">
      {/* Header */}
      <View className="my-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-primary">Caixa</Text>
          <Text className="text-sm text-secondary">Histórico de vendas</Text>
        </View>
        <Pressable
          onPress={() => router.push("/vendas/new")}
          className="rounded-full bg-secondary p-3 shadow-sm active:opacity-80 flex-row items-center gap-2"
        >
          <Feather name="plus" size={20} color="#FFF" />
          <Text className="text-white font-bold pr-1">Nova Venda</Text>
        </Pressable>
      </View>

      {/* Lista */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4A2B20" />
        </View>
      ) : (
        <FlatList
          data={vendas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="mt-10 items-center justify-center">
              <Feather name="inbox" size={48} color="#D89A92" className="mb-4" />
              <Text className="text-center text-lg font-medium text-secondary">
                Nenhuma venda registrada.
              </Text>
              <Text className="text-center text-sm text-gray-500 mt-2">
                Comece a vender e o histórico aparecerá aqui.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
