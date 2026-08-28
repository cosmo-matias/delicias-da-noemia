import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { ReceitasRepository } from "../../db/repositories/receitas";
import { ProducoesRepository } from "../../db/repositories/producoes";
import { Feather } from "@expo/vector-icons";
import type { Receita } from "../../db/schema";

type InsumoProducao = {
  insumoId: number;
  nome: string;
  unidadeMedida: string;
  quantidadeOriginal: number;
  quantidadeUtilizada: string; // Editável
  custoCalculado: number;
  // Auxiliares para o recalculo
  quantidadePacote: number | null;
  ultimoPrecoPago: number | null;
};

export default function NovaProducaoScreen() {
  const router = useRouter();

  // Estados principais
  const [receitasList, setReceitasList] = useState<Receita[]>([]);
  const [pickerAtivo, setPickerAtivo] = useState(false);
  const [receitaSelecionada, setReceitaSelecionada] = useState<Receita | null>(null);
  
  const [insumosList, setInsumosList] = useState<InsumoProducao[]>([]);
  const [rendimentoReal, setRendimentoReal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [custoExtraFixo, setCustoExtraFixo] = useState(0); // Ex: Gás/Energia da receita original
  
  const [loadingBase, setLoadingBase] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // 1. Carregar lista de receitas para o dropdown
  useEffect(() => {
    const loadReceitas = async () => {
      try {
        const data = await ReceitasRepository.listarReceitas();
        setReceitasList(data);
      } catch (err) {
        console.error(err);
      }
    };
    loadReceitas();
  }, []);

  // 2. Ao selecionar uma receita, buscar seus insumos base e preencher
  const handleSelecionarReceita = async (rec: Receita) => {
    setReceitaSelecionada(rec);
    setPickerAtivo(false);
    setRendimentoReal(rec.rendimento.toString());
    setCustoExtraFixo(rec.custoAdicional || 0);
    setLoadingBase(true);

    try {
      const receitaDetalhada = await ReceitasRepository.obterReceitaPorId(rec.id);
      if (receitaDetalhada && receitaDetalhada.insumos) {
        
        // Mapear insumos da ficha técnica
        const insumosPreparados: InsumoProducao[] = await Promise.all(
          receitaDetalhada.insumos.map(async (item: any) => {
            const ultimoPreco = await ReceitasRepository.obterUltimoPrecoInsumo(item.insumoId);
            
            // Calculo inicial
            let custoInicial = 0;
            if (ultimoPreco && item.quantidadeMedida) {
              custoInicial = (ultimoPreco / item.quantidadeMedida) * item.quantidadeUtilizada;
            }

            return {
              insumoId: item.insumoId,
              nome: item.insumoNome,
              unidadeMedida: item.unidadeMedida,
              quantidadeOriginal: item.quantidadeUtilizada,
              quantidadeUtilizada: item.quantidadeUtilizada.toString(),
              custoCalculado: custoInicial,
              quantidadePacote: item.quantidadeMedida,
              ultimoPrecoPago: ultimoPreco,
            };
          })
        );
        
        setInsumosList(insumosPreparados);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao carregar a ficha técnica da receita.");
    } finally {
      setLoadingBase(false);
    }
  };

  // 3. Atualizar a quantidade gasta de um ingrediente e recalcular
  const handleUpdateQuantidade = (index: number, value: string) => {
    const novaLista = [...insumosList];
    const item = novaLista[index];
    item.quantidadeUtilizada = value;

    const qtdNum = parseFloat(value.replace(",", "."));
    if (!isNaN(qtdNum) && item.ultimoPrecoPago && item.quantidadePacote) {
      item.custoCalculado = (item.ultimoPrecoPago / item.quantidadePacote) * qtdNum;
    } else {
      item.custoCalculado = 0;
    }
    
    setInsumosList(novaLista);
  };

  const handleRemoverInsumo = (index: number) => {
    const novaLista = [...insumosList];
    novaLista.splice(index, 1);
    setInsumosList(novaLista);
  };

  // 4. Salvar a Produção Diária
  const handleSalvar = async () => {
    if (!receitaSelecionada) {
      Alert.alert("Erro", "Selecione uma receita base.");
      return;
    }

    const rendimentoNum = parseFloat(rendimentoReal.replace(",", "."));
    if (isNaN(rendimentoNum) || rendimentoNum <= 0) {
      Alert.alert("Erro", "Insira um rendimento válido.");
      return;
    }

    if (insumosList.length === 0) {
      Alert.alert("Aviso", "Não há insumos listados. A produção ficará com custo zero.");
    }

    setSalvando(true);
    try {
      const dataAtual = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const custoIngredientes = insumosList.reduce((acc, item) => acc + item.custoCalculado, 0);
      const custoTotalReal = custoIngredientes + custoExtraFixo;

      const itensFinais = insumosList.map((item) => ({
        insumoId: item.insumoId,
        quantidadeUtilizada: parseFloat(item.quantidadeUtilizada.replace(",", ".")) || 0,
        custoCalculado: item.custoCalculado,
      }));

      await ProducoesRepository.salvarProducaoComInsumos(
        receitaSelecionada.id,
        dataAtual,
        rendimentoNum,
        custoTotalReal,
        observacoes.trim() || undefined,
        itensFinais
      );

      Alert.alert("Sucesso", "Produção registrada com sucesso!");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao registrar produção.");
    } finally {
      setSalvando(false);
    }
  };

  // Cálculos de rodapé
  const custoInsumosView = insumosList.reduce((acc, item) => acc + item.custoCalculado, 0);
  const custoTotalView = custoInsumosView + custoExtraFixo;
  const rendimentoView = parseFloat(rendimentoReal.replace(",", ".")) || 1;
  const custoUnitarioView = custoTotalView / (rendimentoView > 0 ? rendimentoView : 1);

  return (
    <View className="flex-1 bg-background px-4">
      <Stack.Screen options={{ title: "Registrar Fornada" }} />
      
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Escolha da Receita */}
        <View className="mb-6 z-20">
          <Text className="mb-2 text-sm font-semibold text-primary">Receita / Molde Base *</Text>
          <Pressable
            onPress={() => setPickerAtivo(!pickerAtivo)}
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 flex-row justify-between items-center"
          >
            <Text className={`text-base ${receitaSelecionada ? 'text-primary font-bold' : 'text-gray-400'}`}>
              {receitaSelecionada ? receitaSelecionada.nome : "Toque para selecionar..."}
            </Text>
            <Feather name={pickerAtivo ? "chevron-up" : "chevron-down"} size={20} color="#8F6A59" />
          </Pressable>

          {pickerAtivo && (
            <View className="absolute top-[80px] left-0 right-0 max-h-48 rounded-xl border border-secondary/40 bg-white shadow-lg elevation-5 z-50">
              <ScrollView nestedScrollEnabled>
                {receitasList.map((rec) => (
                  <Pressable
                    key={rec.id}
                    onPress={() => handleSelecionarReceita(rec)}
                    className="border-b border-gray-100 p-4 active:bg-gray-50"
                  >
                    <Text className="font-bold text-primary">{rec.nome}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {loadingBase && (
          <ActivityIndicator size="small" color="#4A2B20" className="mb-4" />
        )}

        {/* Instância - Lista Editável */}
        {receitaSelecionada && !loadingBase && (
          <View className="mb-6 z-10">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-primary">Insumos Utilizados</Text>
              <Text className="text-xs text-gray-500">Edite o gasto real</Text>
            </View>

            {insumosList.map((item, index) => (
              <View key={index} className="mb-3 rounded-xl bg-white p-3 border border-secondary/20 flex-row gap-3 shadow-sm">
                <View className="flex-1 justify-center">
                  <Text className="font-bold text-primary text-sm mb-1">{item.nome}</Text>
                  <Text className="text-xs text-red-500 font-semibold">
                    Custo: R$ {item.custoCalculado.toFixed(2)}
                  </Text>
                </View>
                
                <View className="flex-row items-center border border-secondary/30 rounded-lg bg-gray-50 px-2 py-1 w-28">
                  <TextInput
                    className="flex-1 text-center font-bold text-primary"
                    keyboardType="decimal-pad"
                    value={item.quantidadeUtilizada}
                    onChangeText={(val) => handleUpdateQuantidade(index, val)}
                  />
                  <Text className="text-xs text-gray-500 ml-1">{item.unidadeMedida}</Text>
                </View>
                
                <Pressable onPress={() => handleRemoverInsumo(index)} className="justify-center px-1">
                  <Feather name="trash-2" size={20} color="#EF4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Rendimento e Observações */}
        {receitaSelecionada && !loadingBase && (
          <View className="mb-6 z-10">
            <Text className="mb-2 text-sm font-semibold text-primary">Rendimento Real (Unidades) *</Text>
            <TextInput
              className="mb-4 rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary font-bold"
              placeholder="Ex: 10"
              keyboardType="decimal-pad"
              value={rendimentoReal}
              onChangeText={setRendimentoReal}
            />

            <Text className="mb-2 text-sm font-semibold text-primary">Observações da Fornada</Text>
            <TextInput
              className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary min-h-[80px]"
              placeholder="Ex: Assado por mais tempo, substituiu margarina..."
              value={observacoes}
              onChangeText={setObservacoes}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}
      </ScrollView>

      {/* Rodapé de Consolidação */}
      <View className="border-t border-gray-200 bg-background py-4 pb-8 z-0">
        <View className="flex-row justify-between px-2 mb-1">
          <Text className="text-sm text-gray-600">Ingredientes:</Text>
          <Text className="text-sm font-semibold text-gray-700">R$ {custoInsumosView.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between px-2 mb-2 border-b border-gray-200 pb-2">
          <Text className="text-sm text-gray-600">Custos Extras/Gás:</Text>
          <Text className="text-sm font-semibold text-gray-700">R$ {custoExtraFixo.toFixed(2)}</Text>
        </View>

        <View className="flex-row justify-between items-center px-2 mb-1">
          <Text className="text-lg font-bold text-primary">Custo da Fornada:</Text>
          <Text className="text-xl font-bold text-red-500">R$ {custoTotalView.toFixed(2)}</Text>
        </View>
        <View className="flex-row justify-between items-center px-2 mb-4">
          <Text className="text-sm text-gray-500 font-semibold">Custo Unitário Final:</Text>
          <Text className="text-sm font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            R$ {custoUnitarioView.toFixed(2)} / un
          </Text>
        </View>

        <Pressable
          onPress={handleSalvar}
          disabled={salvando || !receitaSelecionada}
          className="items-center rounded-xl bg-primary py-4"
          style={(salvando || !receitaSelecionada) ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {salvando ? "Salvando..." : "Registrar Produção"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
