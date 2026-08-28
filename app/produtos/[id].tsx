import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ProdutosRepository } from "../../db/repositories/produtos";

export default function ProdutoDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [produto, setProduto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(false);

  const productId = Number(id);

  const loadData = useCallback(async () => {
    if (!productId || isNaN(productId)) return;
    try {
      const data = await ProdutosRepository.obterProdutoPorId(productId);
      if (data) {
        setProduto(data);
      } else {
        Alert.alert("Erro", "Produto não encontrado.");
        router.back();
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar permanentemente este produto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeletando(true);
            try {
              await ProdutosRepository.deletarProduto(productId);
              Alert.alert("Sucesso", "Produto deletado com sucesso!");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Erro", "Falha ao excluir produto. Ele pode estar vinculado a vendas.");
              setDeletando(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !produto) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4A2B20" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View className="mb-6 items-center rounded-2xl bg-white p-6 shadow-sm border border-secondary/20">
          <Text className="text-3xl font-bold text-primary text-center mb-2">
            {produto.nome}
          </Text>
          <Text className="text-2xl font-bold text-green-600 mb-2">
            R$ {produto.precoVenda.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        {/* Info Receita */}
        <View className="mb-6 rounded-xl bg-white p-4 border border-secondary/20">
          <Text className="text-sm font-semibold text-secondary mb-1">Receita Base</Text>
          {produto.receitaId ? (
            <>
              <Text className="text-base font-bold text-primary">{produto.receitaNome}</Text>
              <Text className="text-xs text-gray-500 mt-1">Rendimento: {produto.receitaRendimento}</Text>
            </>
          ) : (
            <Text className="text-base text-gray-500 italic">Nenhuma receita vinculada</Text>
          )}
        </View>

        {/* Observações */}
        {produto.observacoes && (
          <View className="mb-8">
            <Text className="mb-2 text-lg font-bold text-primary">Observações</Text>
            <View className="rounded-xl border border-secondary/20 bg-white p-4">
              <Text className="text-sm text-gray-700 leading-5">
                {produto.observacoes}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botões Flutuantes no Rodapé */}
      <View className="border-t border-gray-200 bg-background px-5 py-4 pb-8 flex-row justify-between gap-4">
        <Pressable
          onPress={handleDelete}
          disabled={deletando}
          className="flex-1 items-center justify-center rounded-xl border-2 border-red-500 bg-transparent py-4 active:bg-red-50"
        >
          <Text className="text-base font-bold text-red-500">
            {deletando ? "Excluindo..." : "Excluir"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/produtos/new?editId=${productId}`)}
          className="flex-1 items-center justify-center rounded-xl bg-primary py-4 active:opacity-80"
        >
          <Text className="text-base font-bold text-white">Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}
