import React, { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ProdutosRepository } from "../../db/repositories/produtos";
import { Feather } from "@expo/vector-icons";

export default function ProdutosScreen() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await ProdutosRepository.listarProdutos();
      setProdutos(data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
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

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/produtos/${item.id}`)}
      className="mb-3 rounded-2xl bg-white p-4 shadow-sm border border-secondary/20 flex-row justify-between items-center active:bg-gray-50"
    >
      <View className="flex-1 pr-2">
        <Text className="text-lg font-bold text-primary mb-1">{item.nome}</Text>
        {item.receitaNome && (
          <Text className="text-sm text-gray-500 mb-1">
            Receita: {item.receitaNome}
          </Text>
        )}
      </View>
      <View className="items-end">
        <Text className="text-lg font-bold text-green-600">
          R$ {item.precoVenda.toFixed(2).replace(".", ",")}
        </Text>
        <Feather name="chevron-right" size={20} color="#8F6A59" className="mt-1" />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background px-4">
      {/* Header */}
      <View className="my-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-primary">Meus Produtos</Text>
          <Text className="text-sm text-secondary">
            Catálogo de vendas
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/produtos/new")}
          className="rounded-full bg-secondary p-3 shadow-sm active:opacity-80"
        >
          <Feather name="plus" size={24} color="#FFF" />
        </Pressable>
      </View>

      {/* Lista */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4A2B20" />
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="mt-10 items-center justify-center">
              <Feather name="package" size={48} color="#D89A92" className="mb-4" />
              <Text className="text-center text-lg font-medium text-secondary">
                Nenhum produto cadastrado.
              </Text>
              <Text className="text-center text-sm text-gray-500 mt-2">
                Toque no botão + para registrar um novo produto.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
