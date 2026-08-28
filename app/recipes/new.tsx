import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ReceitasRepository } from "../../db/repositories/receitas";
import { ComprasRepository } from "../../db/repositories/compras";
import type { Insumo } from "../../db/schema";

type RecipeItem = {
  insumoId: number;
  nome: string;
  unidadeMedida: string;
  quantidadeUtilizada: number;
  custoProporcional: number;
};

export default function NovaReceitaScreen() {
  const router = useRouter();

  // Estados da Receita
  const [nome, setNome] = useState("");
  const [rendimento, setRendimento] = useState("1");
  const [custoAdicional, setCustoAdicional] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Estados para Busca de Insumos
  const [busca, setBusca] = useState("");
  const [insumosList, setInsumosList] = useState<Insumo[]>([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState<Insumo | null>(null);

  // Estados do Item Atual
  const [quantidadeUtilizada, setQuantidadeUtilizada] = useState("");
  const [calculandoPreco, setCalculandoPreco] = useState(false);

  // Lista da Ficha Técnica
  const [ingredientes, setIngredientes] = useState<RecipeItem[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Efeito para buscar insumos
  useEffect(() => {
    const buscar = async () => {
      const resultados = await ComprasRepository.listarInsumos(busca);
      setInsumosList(resultados);
    };
    buscar();
  }, [busca]);

  const handleSelecionarInsumo = (insumo: Insumo) => {
    setInsumoSelecionado(insumo);
    setBusca("");
    setQuantidadeUtilizada("");
  };

  const handleAdicionarIngrediente = async () => {
    if (!insumoSelecionado) return;

    const qtd = parseFloat(quantidadeUtilizada.replace(",", "."));
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert("Erro", "Insira uma quantidade válida.");
      return;
    }

    setCalculandoPreco(true);
    try {
      // 1. Obter o último preço pago por este insumo
      const ultimoPreco = await ReceitasRepository.obterUltimoPrecoInsumo(insumoSelecionado.id);
      
      let custoProporcional = 0;

      if (ultimoPreco !== null) {
        // Se a embalagem do insumo tiver uma quantidade definida (ex: 1kg, 500g, 1L), dividimos o preco por ela.
        // Se não tiver, assumimos 1 como base.
        const medidaBase = insumoSelecionado.quantidadeMedida || 1;
        const precoPorMedida = ultimoPreco / medidaBase;
        
        // Custo Proporcional = (Último Preço / Quantidade da Medida Base) * Quantidade Utilizada
        custoProporcional = precoPorMedida * qtd;
      } else {
        // Se nunca foi comprado, alerta o usuário (mas deixa adicionar com custo 0)
        Alert.alert("Aviso", "Este insumo nunca foi comprado. O custo dele será 0 na receita até que uma compra seja registrada.");
      }

      const novoItem: RecipeItem = {
        insumoId: insumoSelecionado.id,
        nome: insumoSelecionado.nome,
        unidadeMedida: insumoSelecionado.unidadeMedida,
        quantidadeUtilizada: qtd,
        custoProporcional,
      };

      setIngredientes([...ingredientes, novoItem]);
      setInsumoSelecionado(null);
      setQuantidadeUtilizada("");
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao calcular custo do insumo.");
    } finally {
      setCalculandoPreco(false);
    }
  };

  const handleRemoverIngrediente = (index: number) => {
    const novaLista = [...ingredientes];
    novaLista.splice(index, 1);
    setIngredientes(novaLista);
  };

  const handleSalvarReceita = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Informe o nome da receita.");
      return;
    }
    if (ingredientes.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um ingrediente à receita.");
      return;
    }

    const rendimentoNum = parseFloat(rendimento.replace(",", ".")) || 1;
    const custoAdicionalNum = parseFloat(custoAdicional.replace(",", ".")) || 0;

    setSalvando(true);
    try {
      await ReceitasRepository.salvarReceitaComInsumos(
        nome.trim(),
        rendimentoNum,
        custoAdicionalNum,
        observacoes.trim() || undefined,
        ingredientes.map(i => ({
          insumoId: i.insumoId,
          quantidadeUtilizada: i.quantidadeUtilizada,
        }))
      );

      Alert.alert("Sucesso", "Receita e ficha técnica criadas!");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      Alert.alert("Erro", "Não foi possível salvar a receita.");
    } finally {
      setSalvando(false);
    }
  };

  // Cálculos de Totais
  const custoInsumos = ingredientes.reduce((acc, item) => acc + item.custoProporcional, 0);
  const custoAdicionalNum = parseFloat(custoAdicional.replace(",", ".")) || 0;
  const custoTotalReceita = custoInsumos + custoAdicionalNum;
  
  const rendimentoNum = parseFloat(rendimento.replace(",", ".")) || 1;
  const custoPorUnidade = custoTotalReceita / rendimentoNum;

  return (
    <View className="flex-1 bg-background px-4">
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Dados Básicos da Receita */}
        <View className="mb-6 rounded-xl border border-secondary/20 bg-white p-4">
          <Text className="text-sm font-semibold text-primary mb-2">Nome da Receita</Text>
          <TextInput
            className="mb-4 rounded-xl border border-secondary/40 bg-gray-50 px-4 py-3 text-base text-primary"
            placeholder="Ex: Bolo de Cenoura com Chocolate"
            value={nome}
            onChangeText={setNome}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-primary mb-2">Rendimento (Und/Porções)</Text>
              <TextInput
                className="rounded-xl border border-secondary/40 bg-gray-50 px-4 py-3 text-base text-primary"
                placeholder="Ex: 10"
                keyboardType="decimal-pad"
                value={rendimento}
                onChangeText={setRendimento}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-primary mb-2">Gás/Energia (R$)</Text>
              <TextInput
                className="rounded-xl border border-secondary/40 bg-gray-50 px-4 py-3 text-base text-primary"
                placeholder="Ex: 5.00"
                keyboardType="decimal-pad"
                value={custoAdicional}
                onChangeText={setCustoAdicional}
              />
            </View>
          </View>
        </View>

        {/* Busca e Inserção de Insumos */}
        <View className="z-10 mb-6">
          <Text className="text-lg font-bold text-primary mb-2">Ficha Técnica (Ingredientes)</Text>
          
          {!insumoSelecionado && (
            <View>
              <TextInput
                className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
                placeholder="Buscar ingrediente..."
                value={busca}
                onChangeText={setBusca}
              />
              {busca.length > 0 && (
                <View className="absolute top-[50px] left-0 right-0 max-h-48 rounded-xl bg-white p-2 shadow-lg z-20">
                  {insumosList.length > 0 ? (
                    <FlatList
                      data={insumosList}
                      keyExtractor={(item) => item.id.toString()}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <Pressable
                          className="border-b border-gray-100 p-3"
                          onPress={() => handleSelecionarInsumo(item)}
                        >
                          <Text className="font-bold text-primary">{item.nome}</Text>
                          {item.marca && <Text className="text-xs text-gray-500">{item.marca}</Text>}
                        </Pressable>
                      )}
                    />
                  ) : (
                    <Text className="text-center text-sm text-gray-500 p-4">Nenhum ingrediente encontrado.</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {insumoSelecionado && (
            <View className="mt-2 rounded-xl border border-secondary/40 bg-white p-4">
              <View className="mb-4 flex-row justify-between items-center">
                <Text className="text-lg font-bold text-primary">{insumoSelecionado.nome}</Text>
                <Pressable onPress={() => setInsumoSelecionado(null)}>
                  <Text className="text-xs font-bold text-red-500">Trocar</Text>
                </Pressable>
              </View>
              
              <Text className="text-sm font-semibold text-primary mb-2">
                Quantidade Utilizada (em {insumoSelecionado.unidadeMedida})
              </Text>
              <TextInput
                className="mb-4 rounded-xl border border-secondary/40 bg-gray-50 px-4 py-3 text-base text-primary"
                placeholder={`Ex: 500 (${insumoSelecionado.unidadeMedida})`}
                keyboardType="decimal-pad"
                value={quantidadeUtilizada}
                onChangeText={setQuantidadeUtilizada}
              />
              
              <Pressable
                onPress={handleAdicionarIngrediente}
                disabled={calculandoPreco}
                className="items-center rounded-xl bg-secondary py-3 flex-row justify-center"
              >
                {calculandoPreco ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-bold text-white">Adicionar à Receita</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Lista de Ingredientes Adicionados */}
        {ingredientes.length > 0 && (
          <View className="mb-6">
            {ingredientes.map((item, index) => (
              <View key={index} className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-3 border border-gray-100">
                <View className="flex-1">
                  <Text className="font-bold text-primary">{item.nome}</Text>
                  <Text className="text-xs text-gray-500">
                    {item.quantidadeUtilizada} {item.unidadeMedida}
                  </Text>
                </View>
                <View className="items-end mr-4">
                  <Text className="font-bold text-primary">R$ {item.custoProporcional.toFixed(2)}</Text>
                </View>
                <Pressable onPress={() => handleRemoverIngrediente(index)} className="p-2">
                  <Text className="text-lg font-bold text-red-500">X</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        
        {/* Observações */}
        <View className="mb-8">
          <Text className="mb-2 text-sm font-semibold text-primary">Observações / Modo de Preparo</Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: Bater claras em neve..."
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Resumo e Botão Salvar (Rodapé Fixo) */}
      <View className="border-t border-gray-200 bg-background py-4 pb-8">
        <View className="mb-2 flex-row justify-between items-center px-2">
          <Text className="text-sm text-gray-600">Custo dos Ingredientes:</Text>
          <Text className="text-sm font-bold text-gray-600">R$ {custoInsumos.toFixed(2)}</Text>
        </View>
        <View className="mb-2 flex-row justify-between items-center px-2">
          <Text className="text-base font-bold text-primary">Custo Total da Receita:</Text>
          <Text className="text-xl font-bold text-primary">R$ {custoTotalReceita.toFixed(2)}</Text>
        </View>
        <View className="mb-4 flex-row justify-between items-center px-2">
          <Text className="text-sm text-green-600 font-semibold">Custo por Rendimento (Und):</Text>
          <Text className="text-sm text-green-600 font-bold">R$ {custoPorUnidade.toFixed(2)} / und</Text>
        </View>

        <Pressable
          onPress={handleSalvarReceita}
          disabled={salvando || ingredientes.length === 0}
          className="items-center rounded-xl bg-primary py-4"
          style={(salvando || ingredientes.length === 0) ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {salvando ? "Salvando..." : "Salvar Receita"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
