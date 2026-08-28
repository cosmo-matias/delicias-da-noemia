import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ProducoesRepository } from "../../db/repositories/producoes";
import { Feather } from "@expo/vector-icons";

export default function ProducoesScreen() {
  const router = useRouter();
  const [producoes, setProducoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await ProducoesRepository.listarProducoes();
      setProducoes(data);
    } catch (err) {
      console.error("Erro ao carregar produções:", err);
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
      onPress={() => router.push(`/producoes/${item.id}`)}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm border border-secondary/20 active:bg-gray-50"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-row items-center flex-1 pr-2">
          <View className="bg-primary/10 p-2 rounded-lg mr-3">
            <Feather name="layers" size={20} color="#4A2B20" />
          </View>
          <View>
            <Text className="text-base font-bold text-primary">
              {item.receitaNome}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(item.data)}
            </Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-red-500">
          R$ {item.custoTotalReal.toFixed(2).replace(".", ",")}
        </Text>
      </View>
      <View className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex-row justify-between items-center">
        <Text className="text-xs text-gray-600 font-semibold">Rendimento Real:</Text>
        <Text className="text-sm font-bold text-primary">{item.rendimentoReal} un</Text>
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background px-4">
      {/* Header */}
      <View className="my-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-primary">Produção</Text>
          <Text className="text-sm text-secondary">Controle de fornadas e custo real</Text>
        </View>
        <Pressable
          onPress={() => router.push("/producoes/new")}
          className="rounded-full bg-secondary p-3 shadow-sm active:opacity-80 flex-row items-center gap-2"
        >
          <Feather name="plus" size={20} color="#FFF" />
          <Text className="text-white font-bold pr-1">Nova Produção</Text>
        </Pressable>
      </View>

      {/* Lista */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4A2B20" />
        </View>
      ) : (
        <FlatList
          data={producoes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="mt-10 items-center justify-center">
              <Feather name="layers" size={48} color="#D89A92" className="mb-4" />
              <Text className="text-center text-lg font-medium text-secondary">
                Nenhuma produção registrada.
              </Text>
              <Text className="text-center text-sm text-gray-500 mt-2">
                Registre sua primeira fornada tocando em +
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
