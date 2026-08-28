import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl, TextInput, Pressable } from "react-native";
import { DashboardRepository } from "../../db/repositories/dashboard";
import { Feather } from "@expo/vector-icons";

type DadosVisaoGeral = {
  totalCompras: number;
  totalVendas: number;
  detalhamentoInsumos: { nome: string; totalGasto: number }[];
  detalhamentoProdutos: { nome: string; totalArrecadado: number }[];
};

export default function VisaoGeralScreen() {
  const [dados, setDados] = useState<DadosVisaoGeral | null>(null);
  const [loading, setLoading] = useState(true);

  // Datas padrão: Primeiro e último dia do mês atual
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const [dataInicio, setDataInicio] = useState(firstDay.toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(lastDay.toISOString().split("T")[0]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await DashboardRepository.obterDadosVisaoGeral(dataInicio, dataFim);
      setDados(result);
    } catch (err) {
      console.error("Erro ao carregar visão geral:", err);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace(".", ",")}`;
  };

  return (
    <View className="flex-1 bg-background">
      {/* Filtros Fixos no Topo */}
      <View className="bg-white px-5 py-4 shadow-sm border-b border-secondary/20 z-10">
        <Text className="text-sm font-semibold text-primary mb-2">Filtrar por Período</Text>
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1">
            <TextInput
              className="rounded-xl border border-secondary/40 bg-gray-50 px-3 py-2 text-sm text-primary"
              placeholder="YYYY-MM-DD"
              value={dataInicio}
              onChangeText={setDataInicio}
            />
          </View>
          <Text className="text-secondary font-bold">até</Text>
          <View className="flex-1">
            <TextInput
              className="rounded-xl border border-secondary/40 bg-gray-50 px-3 py-2 text-sm text-primary"
              placeholder="YYYY-MM-DD"
              value={dataFim}
              onChangeText={setDataFim}
            />
          </View>
          <Pressable
            onPress={loadData}
            className="rounded-xl bg-primary px-4 py-2 items-center justify-center active:opacity-80"
          >
            <Feather name="search" size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-5 pt-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} tintColor="#4A2B20" />
        }
        showsVerticalScrollIndicator={false}
      >
        {dados && (
          <>
            {/* Cartões de Resumo */}
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 rounded-2xl bg-white border border-secondary/20 p-4 shadow-sm items-center justify-center">
                <Text className="text-xs font-semibold text-secondary mb-1 text-center">Total Gasto em Compras</Text>
                <Text className="text-xl font-bold text-red-500">
                  {formatCurrency(dados.totalCompras)}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-white border border-secondary/20 p-4 shadow-sm items-center justify-center">
                <Text className="text-xs font-semibold text-secondary mb-1 text-center">Total Arrecadado</Text>
                <Text className="text-xl font-bold text-green-600">
                  {formatCurrency(dados.totalVendas)}
                </Text>
              </View>
            </View>

            {/* Detalhamento de Compras (Insumos) */}
            <View className="mb-6">
              <Text className="mb-3 text-lg font-bold text-primary">
                Detalhamento de Compras
              </Text>
              {dados.detalhamentoInsumos.length > 0 ? (
                <View className="rounded-2xl bg-white border border-secondary/20 overflow-hidden shadow-sm">
                  {dados.detalhamentoInsumos.map((item, index) => (
                    <View 
                      key={index}
                      className={`flex-row justify-between p-4 ${index !== dados.detalhamentoInsumos.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <Text className="text-base font-semibold text-primary">{item.nome}</Text>
                      <Text className="text-base font-bold text-red-500">
                        {formatCurrency(item.totalGasto)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-gray-500 italic ml-1">Nenhuma compra no período.</Text>
              )}
            </View>

            {/* Detalhamento de Vendas (Produtos) */}
            <View className="mb-8">
              <Text className="mb-3 text-lg font-bold text-primary">
                Detalhamento de Vendas
              </Text>
              {dados.detalhamentoProdutos.length > 0 ? (
                <View className="rounded-2xl bg-white border border-secondary/20 overflow-hidden shadow-sm">
                  {dados.detalhamentoProdutos.map((item, index) => (
                    <View 
                      key={index}
                      className={`flex-row justify-between p-4 ${index !== dados.detalhamentoProdutos.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <Text className="text-base font-semibold text-primary">{item.nome}</Text>
                      <Text className="text-base font-bold text-green-600">
                        {formatCurrency(item.totalArrecadado)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-sm text-gray-500 italic ml-1">Nenhuma venda no período.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
