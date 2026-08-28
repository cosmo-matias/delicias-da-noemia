import React, { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ProducoesRepository } from "../../db/repositories/producoes";

export default function ProducaoDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [producao, setProducao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletando, setDeletando] = useState(false);

  const producaoId = Number(id);

  const loadData = useCallback(async () => {
    if (!producaoId || isNaN(producaoId)) return;
    try {
      const data = await ProducoesRepository.obterProducaoPorId(producaoId);
      if (data) {
        setProducao(data);
      } else {
        Alert.alert("Erro", "Produção não encontrada.");
        router.back();
      }
    } catch (err) {
      console.error("Erro ao carregar detalhes:", err);
    } finally {
      setLoading(false);
    }
  }, [producaoId, router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData])
  );

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar o registro desta fornada? Isso afetará seu relatório de custos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeletando(true);
            try {
              await ProducoesRepository.deletarProducao(producaoId);
              Alert.alert("Sucesso", "Fornada apagada com sucesso!");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Erro", "Falha ao excluir o registro.");
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

  if (loading || !producao) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4A2B20" />
      </View>
    );
  }

  const custoUnitario = producao.custoTotalReal / (producao.rendimentoReal > 0 ? producao.rendimentoReal : 1);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Cabeçalho de Resumo */}
        <View className="mb-6 items-center rounded-2xl bg-white p-6 shadow-sm border border-secondary/20">
          <Text className="text-sm font-semibold text-secondary mb-1">
            Produzido em {formatDate(producao.data)}
          </Text>
          <Text className="text-2xl font-bold text-primary mb-4 text-center">
            {producao.receitaNome}
          </Text>
          
          <View className="flex-row justify-around w-full border-t border-gray-100 pt-4">
            <View className="items-center">
              <Text className="text-xs text-gray-500 mb-1">Rendimento</Text>
              <Text className="text-lg font-bold text-primary">{producao.rendimentoReal} un</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-gray-500 mb-1">Custo Total</Text>
              <Text className="text-lg font-bold text-red-500">
                R$ {producao.custoTotalReal.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-gray-500 mb-1">Custo/Unidade</Text>
              <Text className="text-lg font-bold text-red-600 bg-red-50 px-2 rounded-md">
                R$ {custoUnitario.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          </View>
        </View>

        {/* Itens Consumidos */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-bold text-primary">
            Insumos Consumidos ({producao.itens?.length || 0})
          </Text>
          {producao.itens?.map((item: any) => (
            <View
              key={item.id}
              className="mb-2 flex-row justify-between items-center rounded-xl border border-secondary/20 bg-white p-4"
            >
              <View className="flex-1 pr-2">
                <Text className="font-bold text-primary text-sm mb-1">
                  {item.insumoNome}
                </Text>
                <Text className="text-xs text-gray-600 font-medium bg-gray-100 self-start px-2 py-0.5 rounded-full">
                  {item.quantidadeUtilizada} {item.insumoUnidade}
                </Text>
              </View>
              <View>
                <Text className="font-bold text-red-500 text-sm">
                  R$ {item.custoCalculado.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Observações */}
        {producao.observacoes && (
          <View className="mb-8">
            <Text className="mb-2 text-lg font-bold text-primary">Observações da Fornada</Text>
            <View className="rounded-xl border border-secondary/20 bg-white p-4">
              <Text className="text-sm text-gray-700 leading-5">
                {producao.observacoes}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botões Flutuantes no Rodapé */}
      <View className="border-t border-gray-200 bg-background px-5 py-4 pb-8 flex-row justify-center">
        <Pressable
          onPress={handleDelete}
          disabled={deletando}
          className="flex-1 items-center justify-center rounded-xl border-2 border-red-500 bg-transparent py-4 active:bg-red-50"
        >
          <Text className="text-base font-bold text-red-500">
            {deletando ? "Apagando..." : "Apagar Fornada"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
