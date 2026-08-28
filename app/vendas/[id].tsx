import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { VendasRepository } from "../../db/repositories/vendas";

export default function VendaDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [venda, setVenda] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(false);

  const vendaId = Number(id);

  const loadData = useCallback(async () => {
    if (!vendaId || isNaN(vendaId)) return;
    try {
      const data = await VendasRepository.obterVendaPorId(vendaId);
      if (data) {
        setVenda(data);
      } else {
        Alert.alert("Erro", "Venda não encontrada.");
        router.back();
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    } finally {
      setLoading(false);
    }
  }, [vendaId, router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Estorno",
      "Tem certeza que deseja apagar permanentemente esta venda? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeletando(true);
            try {
              await VendasRepository.deletarVenda(vendaId);
              Alert.alert("Sucesso", "Venda apagada com sucesso!");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Erro", "Falha ao excluir a venda.");
              setDeletando(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  if (loading || !venda) {
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
          <Text className="text-sm font-semibold text-secondary mb-1">
            Recibo da Venda #{venda.id}
          </Text>
          <Text className="text-3xl font-bold text-green-600 mb-2">
            R$ {venda.valorTotal.toFixed(2).replace(".", ",")}
          </Text>
          {venda.custosExtras > 0 && (
            <Text className="text-sm text-red-500 font-semibold mb-2">
              (+ R$ {venda.custosExtras.toFixed(2).replace(".", ",")} de taxa/entrega)
            </Text>
          )}
          <Text className="text-base text-gray-600 font-medium">
            Realizada em {formatDate(venda.data)}
          </Text>
        </View>

        {/* Itens */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-bold text-primary">
            Itens Vendidos ({venda.itens?.length || 0})
          </Text>
          {venda.itens?.map((item: any) => (
            <View
              key={item.id}
              className="mb-2 rounded-xl border border-secondary/20 bg-white p-4"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-2">
                  <Text className="font-bold text-primary text-base">
                    {item.produtoNome}
                  </Text>
                </View>
                <Text className="font-bold text-primary">
                  R$ {item.precoTotal.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              
              <View className="flex-row justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                <Text className="text-xs text-gray-600">
                  {item.quantidade} unidade(s)
                </Text>
                <Text className="text-xs text-gray-600">
                  R$ {item.precoUnitario.toFixed(2).replace(".", ",")} cada
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Observações */}
        {venda.observacoes && (
          <View className="mb-8">
            <Text className="mb-2 text-lg font-bold text-primary">Observações do Pedido</Text>
            <View className="rounded-xl border border-secondary/20 bg-white p-4">
              <Text className="text-sm text-gray-700 leading-5">
                {venda.observacoes}
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
            {deletando ? "Estornando..." : "Apagar Venda"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/vendas/new?editId=${venda.id}`)}
          className="flex-1 items-center justify-center rounded-xl bg-primary py-4 active:opacity-80"
        >
          <Text className="text-base font-bold text-white">Editar Pedido</Text>
        </Pressable>
      </View>
    </View>
  );
}
