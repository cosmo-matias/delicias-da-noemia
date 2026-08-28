import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { db } from "../../db/client";
import { products, recipes } from "../../db/schema";
import type { Recipe } from "../../db/schema";

export default function NewProductScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const result = await db.select().from(recipes);
        setAvailableRecipes(result);
      } catch (err) {
        console.error("Erro ao carregar receitas:", err);
      }
    };
    loadRecipes();
  }, []);

  const getRecipeName = (id: number | null) => {
    if (!id) return null;
    return availableRecipes.find((r) => r.id === id)?.name ?? null;
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert("Erro", "Informe o nome do produto.");
      return false;
    }
    if (!selectedRecipeId) {
      Alert.alert("Erro", "Selecione a receita base do produto.");
      return false;
    }
    const price = parseFloat(salePrice.replace(",", "."));
    if (isNaN(price) || price <= 0) {
      Alert.alert("Erro", "Informe um preço de venda válido.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await db.insert(products).values({
        name: name.trim(),
        recipeId: selectedRecipeId!,
        salePrice: parseFloat(salePrice.replace(",", ".")),
      });

      Alert.alert("Sucesso", "Produto criado com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      Alert.alert("Erro", "Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-background px-5 pt-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Nome do Produto */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Nome do Produto *
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: Bolo de Pote Morango"
            placeholderTextColor="#D89A92"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Receita Base */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Receita Base (Ficha Técnica) *
          </Text>
          
          <Pressable
            onPress={() => setIsPickerOpen(!isPickerOpen)}
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3"
          >
            <Text
              className={
                selectedRecipeId ? "text-base text-primary" : "text-base text-secondary/70"
              }
            >
              {getRecipeName(selectedRecipeId) ?? "Selecione a receita..."}
            </Text>
          </Pressable>

          {isPickerOpen && (
            <View className="mt-2 max-h-48 rounded-xl border border-secondary/30 bg-white">
              <ScrollView nestedScrollEnabled>
                {availableRecipes.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      setSelectedRecipeId(r.id);
                      setIsPickerOpen(false);
                    }}
                    className="border-b border-secondary/10 px-4 py-3 active:bg-background"
                  >
                    <Text className="text-base text-primary">{r.name}</Text>
                    <Text className="text-xs text-secondary">
                      Rendimento: {r.yieldQuantity} un
                    </Text>
                  </Pressable>
                ))}
                {availableRecipes.length === 0 && (
                  <View className="p-4">
                    <Text className="text-center text-sm text-secondary">
                      Nenhuma receita cadastrada.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Preço de Venda */}
        <View className="mb-8">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Preço de Venda (R$) *
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: 12,50"
            placeholderTextColor="#D89A92"
            value={salePrice}
            onChangeText={setSalePrice}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Botão Salvar */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="items-center rounded-xl bg-primary py-4 active:opacity-80"
          style={saving ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {saving ? "Salvando..." : "Criar Produto"}
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
