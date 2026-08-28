import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ProdutosRepository } from "../../db/repositories/produtos";
import { ReceitasRepository } from "../../db/repositories/receitas";
import { ProducoesRepository } from "../../db/repositories/producoes";
import type { Receita } from "../../db/schema";
import { Feather } from "@expo/vector-icons";

export default function NovoProdutoScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const isEditing = !!editId;
  const productId = Number(editId);

  // Estados
  const [nome, setNome] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [observacoes, setObservacoes] = useState("");
  
  // Receitas para o Select
  const [receitasList, setReceitasList] = useState<Receita[]>([]);
  const [receitaSelecionada, setReceitaSelecionada] = useState<Receita | null>(null);
  const [pickerAtivo, setPickerAtivo] = useState(false);
  const [ultimoCusto, setUltimoCusto] = useState<number | null>(null);

  const [salvando, setSalvando] = useState(false);

  // Carregar dados (Edição e Lista de Receitas)
  useEffect(() => {
    const loadData = async () => {
      try {
        // Carrega receitas
        const receitas = await ReceitasRepository.listarReceitas();
        setReceitasList(receitas);

        // Carrega dados de edição
        if (isEditing && productId) {
          const produto = await ProdutosRepository.obterProdutoPorId(productId);
          if (produto) {
            setNome(produto.nome);
            setPrecoVenda(produto.precoVenda.toString());
            setObservacoes(produto.observacoes || "");
            
            if (produto.receitaId) {
              const rec = receitas.find(r => r.id === produto.receitaId);
              if (rec) setReceitaSelecionada(rec);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, [isEditing, productId]);

  useEffect(() => {
    const fetchCusto = async () => {
      if (receitaSelecionada) {
        const custo = await ProducoesRepository.obterUltimoCustoProducao(receitaSelecionada.id);
        setUltimoCusto(custo);
      } else {
        setUltimoCusto(null);
      }
    };
    fetchCusto();
  }, [receitaSelecionada]);

  const handleSalvar = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do produto é obrigatório.");
      return;
    }

    const precoNum = parseFloat(precoVenda.replace(",", "."));
    if (isNaN(precoNum) || precoNum <= 0) {
      Alert.alert("Erro", "Insira um preço de venda válido.");
      return;
    }

    setSalvando(true);
    try {
      const recId = receitaSelecionada ? receitaSelecionada.id : undefined;
      const obs = observacoes.trim() || undefined;

      if (isEditing) {
        await ProdutosRepository.atualizarProduto(productId, {
          nome: nome.trim(),
          precoVenda: precoNum,
          receitaId: recId,
          observacoes: obs,
        });
        Alert.alert("Sucesso", "Produto atualizado com sucesso!");
      } else {
        await ProdutosRepository.salvarProduto(nome.trim(), precoNum, recId, obs);
        Alert.alert("Sucesso", "Produto criado com sucesso!");
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-4">
      <Stack.Screen
        options={{ title: isEditing ? "Editar Produto" : "Novo Produto" }}
      />
      
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Nome */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">Nome do Produto *</Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: Bolo de Pote - Cenoura"
            value={nome}
            onChangeText={setNome}
          />
        </View>

        {/* Preço de Venda */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">Preço de Venda (R$) *</Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: 8.50"
            keyboardType="decimal-pad"
            value={precoVenda}
            onChangeText={setPrecoVenda}
          />
        </View>

        {/* Seletor de Receita */}
        <View className="mb-5 z-20 relative">
          <Text className="mb-2 text-sm font-semibold text-primary">Receita Base (Opcional)</Text>
          <Pressable
            onPress={() => setPickerAtivo(!pickerAtivo)}
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 flex-row justify-between items-center"
          >
            <Text className={`text-base ${receitaSelecionada ? 'text-primary' : 'text-gray-400'}`}>
              {receitaSelecionada ? receitaSelecionada.nome : "Selecionar Receita"}
            </Text>
          </Pressable>
          
          {receitaSelecionada && (
            <Pressable onPress={() => setReceitaSelecionada(null)} className="mt-2 self-end">
              <Text className="text-sm font-semibold text-red-500">Remover Receita</Text>
            </Pressable>
          )}

          {pickerAtivo && (
            <View className="absolute top-[80px] left-0 right-0 max-h-48 rounded-xl border border-secondary/40 bg-white shadow-lg elevation-5 z-50">
              <ScrollView nestedScrollEnabled>
                {receitasList.map((rec) => (
                  <Pressable
                    key={rec.id}
                    onPress={() => {
                      setReceitaSelecionada(rec);
                      setPickerAtivo(false);
                    }}
                    className="border-b border-gray-100 p-4 active:bg-gray-50"
                  >
                    <Text className="font-bold text-primary">{rec.nome}</Text>
                  </Pressable>
                ))}
                {receitasList.length === 0 && (
                  <Text className="p-4 text-center text-gray-500">Nenhuma receita cadastrada.</Text>
                )}
              </ScrollView>
            </View>
          )}

          {/* Comparativo de Custos e Margem */}
          {receitaSelecionada && ultimoCusto !== null && (
            <View className="mt-4 rounded-xl border border-secondary/20 bg-gray-50 p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-xs text-gray-500">Custo da Última Fornada:</Text>
                <Text className="text-sm font-bold text-red-500">R$ {ultimoCusto.toFixed(2)} / un</Text>
              </View>
              
              {parseFloat(precoVenda.replace(",", ".")) > 0 && (
                <View className="flex-row justify-between pt-2 border-t border-gray-200">
                  <Text className="text-xs font-semibold text-primary">Margem de Lucro:</Text>
                  <Text className={`text-sm font-bold ${
                    ((parseFloat(precoVenda.replace(",", ".")) - ultimoCusto) / parseFloat(precoVenda.replace(",", ".")) * 100) > 0 
                    ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(((parseFloat(precoVenda.replace(",", ".")) - ultimoCusto) / parseFloat(precoVenda.replace(",", "."))) * 100).toFixed(1)}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Observações */}
        <View className="mb-8 z-10">
          <Text className="mb-2 text-sm font-semibold text-primary">Observações</Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary min-h-[100px]"
            placeholder="Dicas de embalagem, validade..."
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Botão Salvar */}
      <View className="border-t border-gray-200 bg-background py-4 pb-8 z-0">
        <Pressable
          onPress={handleSalvar}
          disabled={salvando}
          className="items-center rounded-xl bg-primary py-4 active:opacity-80"
          style={salvando ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {salvando ? "Salvando..." : (isEditing ? "Salvar Edição" : "Criar Produto")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
