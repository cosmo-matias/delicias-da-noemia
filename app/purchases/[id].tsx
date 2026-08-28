import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ComprasRepository } from "../../db/repositories/compras";

export default function PurchaseDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [compra, setCompra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(false);

  const purchaseId = Number(id);

  const loadData = useCallback(async () => {
    if (!purchaseId || isNaN(purchaseId)) return;
    try {
      const data = await ComprasRepository.obterCompraPorId(purchaseId);
      if (data) {
        setCompra(data);
      } else {
        Alert.alert("Erro", "Compra não encontrada.");
        router.back();
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    } finally {
      setLoading(false);
    }
  }, [purchaseId, router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar permanentemente esta compra?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeletando(true);
            try {
              await ComprasRepository.deletarCompra(purchaseId);
              Alert.alert("Sucesso", "Compra deletada com sucesso!");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Erro", "Falha ao excluir a compra.");
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

  if (loading || !compra) {
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
            Resumo da Compra #{compra.id}
          </Text>
          <Text className="text-3xl font-bold text-primary mb-2">
            R$ {compra.valorTotal.toFixed(2).replace(".", ",")}
          </Text>
          {compra.custosExtras > 0 && (
            <Text className="text-sm text-red-500 font-semibold mb-2">
              (Inclui R$ {compra.custosExtras.toFixed(2).replace(".", ",")} de custos extras)
            </Text>
          )}
          <Text className="text-base text-gray-600 font-medium">
            Realizada em {formatDate(compra.data)}
          </Text>
        </View>

        {/* Itens */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-bold text-primary">
            Itens Comprados ({compra.itens?.length || 0})
          </Text>
          {compra.itens?.map((item: any) => (
            <View
              key={item.id}
              className="mb-2 rounded-xl border border-secondary/20 bg-white p-4"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 pr-2">
                  <Text className="font-bold text-primary text-base">
                    {item.insumoNome}
                  </Text>
                  {item.insumoMarca && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {item.insumoMarca}
                    </Text>
                  )}
                </View>
                <Text className="font-bold text-primary">
                  R$ {item.precoTotal.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              
              <View className="flex-row justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                <Text className="text-xs text-gray-600">
                  {item.quantidade} {item.unidadeMedida}
                </Text>
                <Text className="text-xs text-gray-600">
                  R$ {item.precoUnitario.toFixed(2).replace(".", ",")} cada
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Observações */}
        {compra.observacoes && (
          <View className="mb-8">
            <Text className="mb-2 text-lg font-bold text-primary">Observações</Text>
            <View className="rounded-xl border border-secondary/20 bg-white p-4">
              <Text className="text-sm text-gray-700 leading-5">
                {compra.observacoes}
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
          onPress={() => router.push(`/purchases/new?editId=${purchaseId}`)}
          className="flex-1 items-center justify-center rounded-xl bg-primary py-4 active:opacity-80"
        >
          <Text className="text-base font-bold text-white">Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}
