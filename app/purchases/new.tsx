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
import { ComprasRepository } from "../../db/repositories/compras";
import type { Insumo } from "../../db/schema";
import ModalInsumo from "../../components/ModalInsumo";

type CartItem = {
  insumoId: number;
  nome: string;
  marca: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitario: number;
};

export default function NovaCompraScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const isEditing = !!editId;
  const purchaseId = Number(editId);
  
  // Estados para Busca
  const [busca, setBusca] = useState("");
  const [insumosList, setInsumosList] = useState<Insumo[]>([]);
  const [insumoSelecionado, setInsumoSelecionado] = useState<Insumo | null>(null);

  // Estados do Formulário de Adição de Item
  const [quantidade, setQuantidade] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");

  // Estados do Carrinho e Compra
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [dataOriginal, setDataOriginal] = useState<string | null>(null);

  // Estado do Modal de Cadastro Rápido de Insumo
  const [modalInsumoVisivel, setModalInsumoVisivel] = useState(false);

  // Efeito para carregar dados se estiver editando
  useEffect(() => {
    if (isEditing && purchaseId) {
      const carregarCompra = async () => {
        try {
          const compra = await ComprasRepository.obterCompraPorId(purchaseId);
          if (compra) {
            setObservacoes(compra.observacoes || "");
            setDataOriginal(compra.data);
            
            const itensFormatados: CartItem[] = compra.itens.map((item: any) => ({
              insumoId: item.insumoId,
              nome: item.insumoNome,
              marca: item.insumoMarca || "",
              unidadeMedida: item.unidadeMedida,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            }));
            
            setCarrinho(itensFormatados);
          }
        } catch (error) {
          console.error("Erro ao carregar edição:", error);
          Alert.alert("Erro", "Não foi possível carregar os dados da compra.");
        }
      };
      carregarCompra();
    }
  }, [isEditing, purchaseId]);

  // Efeito para buscar insumos quando o texto muda
  useEffect(() => {
    const buscar = async () => {
      const resultados = await ComprasRepository.listarInsumos(busca);
      setInsumosList(resultados);
    };
    buscar();
  }, [busca]);

  const handleSelecionarInsumo = (insumo: Insumo) => {
    setInsumoSelecionado(insumo);
    setBusca(""); // Limpa a busca ao selecionar
    setQuantidade("");
    setPrecoUnitario("");
  };

  const handleAdicionarCarrinho = () => {
    if (!insumoSelecionado) return;
    
    const qtd = parseFloat(quantidade.replace(",", "."));
    const preco = parseFloat(precoUnitario.replace(",", "."));

    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert("Erro", "Insira uma quantidade válida.");
      return;
    }
    if (isNaN(preco) || preco < 0) {
      Alert.alert("Erro", "Insira um preço unitário válido.");
      return;
    }

    const novoItem: CartItem = {
      insumoId: insumoSelecionado.id,
      nome: insumoSelecionado.nome,
      marca: insumoSelecionado.marca || "",
      unidadeMedida: insumoSelecionado.unidadeMedida,
      quantidade: qtd,
      precoUnitario: preco,
    };

    setCarrinho([...carrinho, novoItem]);
    setInsumoSelecionado(null);
    setQuantidade("");
    setPrecoUnitario("");
  };

  const handleRemoverDoCarrinho = (index: number) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const handleSalvarCompra = async () => {
    if (carrinho.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um item à compra.");
      return;
    }

    setSalvando(true);
    try {
      const dataAtual = dataOriginal || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const itensMapeados = carrinho.map((item) => ({
        insumoId: item.insumoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      }));

      if (isEditing) {
        await ComprasRepository.atualizarCompraComItens(
          purchaseId,
          { data: dataAtual, observacoes: observacoes.trim() || undefined },
          itensMapeados
        );
        Alert.alert("Sucesso", "Compra atualizada com sucesso!");
      } else {
        await ComprasRepository.salvarCompraComItens(
          dataAtual,
          observacoes.trim() || undefined,
          itensMapeados
        );
        Alert.alert("Sucesso", "Compra salva com sucesso!");
      }

      setCarrinho([]);
      setObservacoes("");
      router.back();
    } catch (error) {
      console.error("Erro ao salvar compra:", error);
      Alert.alert("Erro", "Não foi possível salvar a compra.");
    } finally {
      setSalvando(false);
    }
  };

  const valorTotalCompra = carrinho.reduce(
    (acc, item) => acc + item.quantidade * item.precoUnitario,
    0
  );

  return (
    <View className="flex-1 bg-background px-4">
      <Stack.Screen
        options={{ title: isEditing ? "Editar Compra" : "Nova Compra" }}
      />
      {/* Busca e Seleção de Insumo */}
      <View className="z-10 mt-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-primary">
            Buscar Insumo
          </Text>
          <Pressable onPress={() => setModalInsumoVisivel(true)}>
            <Text className="text-sm font-bold text-secondary">+ Novo Insumo</Text>
          </Pressable>
        </View>

        {!insumoSelecionado && (
          <>
            <TextInput
              className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
              placeholder="Digite o nome do insumo..."
              placeholderTextColor="#D89A92"
              value={busca}
              onChangeText={setBusca}
            />
            
            {busca.length > 0 && insumosList.length > 0 && (
              <View className="absolute top-[80px] left-0 right-0 max-h-48 rounded-xl bg-white p-2 shadow-lg elevation-5 z-20">
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
              </View>
            )}
            
            {busca.length > 0 && insumosList.length === 0 && (
              <View className="absolute top-[80px] left-0 right-0 rounded-xl bg-white p-4 shadow-lg elevation-5 z-20">
                <Text className="text-center text-sm text-gray-500">Nenhum insumo encontrado.</Text>
              </View>
            )}
          </>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Formulário do Insumo Selecionado */}
        {insumoSelecionado && (
          <View className="mb-6 rounded-xl border border-secondary/30 bg-white p-4">
            <View className="mb-4 flex-row justify-between items-start">
              <View>
                <Text className="text-lg font-bold text-primary">{insumoSelecionado.nome}</Text>
                <Text className="text-sm text-gray-500">
                  {insumoSelecionado.marca ? `${insumoSelecionado.marca} • ` : ""}
                  Vendido em {insumoSelecionado.unidadeMedida}
                </Text>
              </View>
              <Pressable onPress={() => setInsumoSelecionado(null)}>
                <Text className="text-xs font-bold text-red-500">Trocar</Text>
              </Pressable>
            </View>

            <View className="flex-row justify-between gap-4">
              <View className="flex-1">
                <Text className="mb-1 text-xs font-semibold text-primary">Qtd Comprada</Text>
                <TextInput
                  className="rounded-xl border border-secondary/40 bg-gray-50 px-3 py-2 text-primary"
                  placeholder="Ex: 2"
                  keyboardType="decimal-pad"
                  value={quantidade}
                  onChangeText={setQuantidade}
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1 text-xs font-semibold text-primary">Preço Unit. (R$)</Text>
                <TextInput
                  className="rounded-xl border border-secondary/40 bg-gray-50 px-3 py-2 text-primary"
                  placeholder="Ex: 15.50"
                  keyboardType="decimal-pad"
                  value={precoUnitario}
                  onChangeText={setPrecoUnitario}
                />
              </View>
            </View>
            
            <Pressable
              onPress={handleAdicionarCarrinho}
              className="mt-4 items-center rounded-xl bg-secondary py-3"
            >
              <Text className="font-bold text-white">Adicionar ao Carrinho</Text>
            </Pressable>
          </View>
        )}

        {/* Lista de Itens no Carrinho */}
        {carrinho.length > 0 && (
          <View className="mb-6">
            <Text className="mb-2 text-lg font-bold text-primary">
              Carrinho ({carrinho.length})
            </Text>
            {carrinho.map((item, index) => (
              <View
                key={index}
                className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-3 shadow-sm"
              >
                <View className="flex-1">
                  <Text className="font-bold text-primary">{item.nome}</Text>
                  <Text className="text-xs text-gray-500">
                    {item.quantidade} {item.unidadeMedida} x R$ {item.precoUnitario.toFixed(2)}
                  </Text>
                </View>
                <View className="items-end mr-4">
                  <Text className="font-bold text-primary">
                    R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemoverDoCarrinho(index)}>
                  <Text className="text-lg font-bold text-red-500">X</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Observações */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Observações Gerais
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: Fui no mercado X..."
            placeholderTextColor="#D89A92"
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Resumo e Salvar */}
      <View className="border-t border-gray-200 bg-background py-4 pb-8">
        <View className="mb-4 flex-row justify-between items-center px-2">
          <Text className="text-lg text-primary">Valor Total:</Text>
          <Text className="text-2xl font-bold text-primary">
            R$ {valorTotalCompra.toFixed(2)}
          </Text>
        </View>

        <Pressable
          onPress={handleSalvarCompra}
          disabled={salvando || carrinho.length === 0}
          className="items-center rounded-xl bg-primary py-4"
          style={(salvando || carrinho.length === 0) ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {salvando ? "Salvando..." : (isEditing ? "Salvar Edição" : "Finalizar Compra")}
          </Text>
        </Pressable>
      </View>

      {/* Modal de Insumo */}
      <ModalInsumo
        visible={modalInsumoVisivel}
        onClose={() => setModalInsumoVisivel(false)}
        onSuccess={(novo) => {
          handleSelecionarInsumo(novo);
        }}
      />
    </View>
  );
}
