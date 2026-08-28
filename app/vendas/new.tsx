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
import { VendasRepository } from "../../db/repositories/vendas";
import { ProdutosRepository } from "../../db/repositories/produtos";
import type { Produto } from "../../db/schema";
import { Feather } from "@expo/vector-icons";

type CartItem = {
  produtoId: number;
  nome: string;
  quantidade: number;
  precoUnitario: number;
};

export default function NovaVendaScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams();
  const isEditing = !!editId;
  const vendaId = Number(editId);

  // Busca de Produtos
  const [produtosList, setProdutosList] = useState<Produto[]>([]);
  const [pickerAtivo, setPickerAtivo] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);

  // Item Selecionado
  const [quantidade, setQuantidade] = useState("1");

  // Carrinho e Venda
  const [carrinho, setCarrinho] = useState<CartItem[]>([]);
  const [custosExtras, setCustosExtras] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [dataOriginal, setDataOriginal] = useState<string | null>(null);
  
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prods = await ProdutosRepository.listarProdutos();
        setProdutosList(prods);

        if (isEditing && vendaId) {
          const venda = await VendasRepository.obterVendaPorId(vendaId);
          if (venda) {
            setDataOriginal(venda.data);
            setCustosExtras(venda.custosExtras ? venda.custosExtras.toString() : "");
            setObservacoes(venda.observacoes || "");
            
            const itensFormatados: CartItem[] = venda.itens.map((item: any) => ({
              produtoId: item.produtoId,
              nome: item.produtoNome,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
            }));
            
            setCarrinho(itensFormatados);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    loadData();
  }, [isEditing, vendaId]);

  const handleAdicionarCarrinho = () => {
    if (!produtoSelecionado) return;

    const qtd = parseFloat(quantidade.replace(",", "."));
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert("Erro", "Insira uma quantidade válida.");
      return;
    }

    const novoItem: CartItem = {
      produtoId: produtoSelecionado.id,
      nome: produtoSelecionado.nome,
      quantidade: qtd,
      precoUnitario: produtoSelecionado.precoVenda,
    };

    setCarrinho([...carrinho, novoItem]);
    setProdutoSelecionado(null);
    setQuantidade("1");
    setPickerAtivo(false);
  };

  const handleRemoverDoCarrinho = (index: number) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const handleSalvarVenda = async () => {
    if (carrinho.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um produto ao carrinho.");
      return;
    }

    setSalvando(true);
    try {
      const dataAtual = dataOriginal || new Date().toISOString().split("T")[0];
      const extrasNumber = parseFloat(custosExtras.replace(",", ".")) || 0;
      
      const itensMapeados = carrinho.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
      }));

      if (isEditing) {
        await VendasRepository.atualizarVendaComItens(
          vendaId,
          { data: dataAtual, custosExtras: extrasNumber, observacoes: observacoes.trim() || undefined },
          itensMapeados
        );
        Alert.alert("Sucesso", "Venda atualizada com sucesso!");
      } else {
        await VendasRepository.salvarVendaComItens(
          dataAtual,
          extrasNumber,
          observacoes.trim() || undefined,
          itensMapeados
        );
        Alert.alert("Sucesso", "Venda registrada com sucesso!");
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao registrar venda.");
    } finally {
      setSalvando(false);
    }
  };

  const valorTotalItens = carrinho.reduce(
    (acc, item) => acc + item.quantidade * item.precoUnitario,
    0
  );
  const extrasNumberDisplay = parseFloat(custosExtras.replace(",", ".")) || 0;
  const valorTotalVenda = valorTotalItens + extrasNumberDisplay;

  return (
    <View className="flex-1 bg-background px-4">
      <Stack.Screen
        options={{ title: isEditing ? "Editar Venda" : "Novo Pedido (Caixa)" }}
      />
      
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Seleção de Produto */}
        <View className="mb-6 z-20">
          <Text className="mb-2 text-sm font-semibold text-primary">Buscar Produto</Text>
          
          <Pressable
            onPress={() => setPickerAtivo(!pickerAtivo)}
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 flex-row justify-between items-center"
          >
            <Text className={`text-base ${produtoSelecionado ? 'text-primary' : 'text-gray-400'}`}>
              {produtoSelecionado ? produtoSelecionado.nome : "Toque para selecionar..."}
            </Text>
            <Feather name={pickerAtivo ? "chevron-up" : "chevron-down"} size={20} color="#8F6A59" />
          </Pressable>

          {pickerAtivo && (
            <View className="absolute top-[80px] left-0 right-0 max-h-48 rounded-xl border border-secondary/40 bg-white shadow-lg elevation-5 z-50">
              <ScrollView nestedScrollEnabled>
                {produtosList.map((prod) => (
                  <Pressable
                    key={prod.id}
                    onPress={() => {
                      setProdutoSelecionado(prod);
                      setPickerAtivo(false);
                      setQuantidade("1");
                    }}
                    className="border-b border-gray-100 p-4 active:bg-gray-50 flex-row justify-between items-center"
                  >
                    <Text className="font-bold text-primary">{prod.nome}</Text>
                    <Text className="text-sm text-green-600 font-semibold">R$ {prod.precoVenda.toFixed(2)}</Text>
                  </Pressable>
                ))}
                {produtosList.length === 0 && (
                  <Text className="p-4 text-center text-gray-500">Nenhum produto cadastrado no catálogo.</Text>
                )}
              </ScrollView>
            </View>
          )}

          {/* Adicionar ao Carrinho */}
          {produtoSelecionado && (
            <View className="mt-4 rounded-xl border border-secondary/20 bg-white p-4">
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-primary mb-1">Preço Unitário</Text>
                  <Text className="text-lg font-bold text-green-600">R$ {produtoSelecionado.precoVenda.toFixed(2)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-primary mb-1">Quantidade</Text>
                  <TextInput
                    className="rounded-lg border border-secondary/40 bg-gray-50 px-3 py-2 text-primary"
                    placeholder="Ex: 2"
                    keyboardType="decimal-pad"
                    value={quantidade}
                    onChangeText={setQuantidade}
                  />
                </View>
              </View>
              <Pressable
                onPress={handleAdicionarCarrinho}
                className="items-center rounded-xl bg-secondary py-3 flex-row justify-center gap-2"
              >
                <Feather name="shopping-cart" size={18} color="#FFF" />
                <Text className="font-bold text-white">Adicionar ao Carrinho</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Carrinho de Compras */}
        {carrinho.length > 0 && (
          <View className="mb-6 z-10">
            <Text className="mb-2 text-lg font-bold text-primary">
              Carrinho ({carrinho.length})
            </Text>
            {carrinho.map((item, index) => (
              <View
                key={index}
                className="mb-2 flex-row items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-secondary/10"
              >
                <View className="flex-1">
                  <Text className="font-bold text-primary">{item.nome}</Text>
                  <Text className="text-xs text-gray-500">
                    {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                  </Text>
                </View>
                <View className="items-end mr-4">
                  <Text className="font-bold text-primary">
                    R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemoverDoCarrinho(index)}>
                  <Feather name="x-circle" size={24} color="#EF4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Taxas Extras e Observações */}
        <View className="mb-6 z-10">
          <Text className="mb-2 text-sm font-semibold text-primary">Taxa de Entrega / Custos Extras (R$)</Text>
          <TextInput
            className="mb-4 rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: 5.00"
            keyboardType="decimal-pad"
            value={custosExtras}
            onChangeText={setCustosExtras}
          />

          <Text className="mb-2 text-sm font-semibold text-primary">Observações da Venda</Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary min-h-[80px]"
            placeholder="Cliente, endereço, observações..."
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Resumo e Botão Salvar */}
      <View className="border-t border-gray-200 bg-background py-4 pb-8 z-0">
        <View className="mb-2 flex-row justify-between items-center px-2">
          <Text className="text-sm text-gray-600">Subtotal dos itens:</Text>
          <Text className="text-sm font-bold text-gray-600">R$ {valorTotalItens.toFixed(2)}</Text>
        </View>
        <View className="mb-4 flex-row justify-between items-center px-2">
          <Text className="text-xl font-bold text-primary">Valor Total:</Text>
          <Text className="text-2xl font-bold text-green-600">R$ {valorTotalVenda.toFixed(2)}</Text>
        </View>

        <Pressable
          onPress={handleSalvarVenda}
          disabled={salvando || carrinho.length === 0}
          className="items-center rounded-xl bg-primary py-4"
          style={(salvando || carrinho.length === 0) ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {salvando ? "Processando..." : (isEditing ? "Salvar Edição" : "Confirmar Venda")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
