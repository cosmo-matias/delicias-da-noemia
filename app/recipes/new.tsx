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
import {
  recipes,
  recipeIngredients,
  ingredients as ingredientsTable,
} from "../../db/schema";
import type { Ingredient } from "../../db/schema";

const UNITS = ["kg", "g", "L", "ml", "un"] as const;

type IngredientRow = {
  key: string;
  ingredientId: number | null;
  quantity: string;
  unit: (typeof UNITS)[number];
};

function generateKey() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NewRecipeScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Dados da receita
  const [name, setName] = useState("");
  const [yieldQty, setYieldQty] = useState("1");
  const [notes, setNotes] = useState("");

  // Ingredientes disponíveis (do banco)
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);

  // Linhas de ingredientes do formulário
  const [rows, setRows] = useState<IngredientRow[]>([
    { key: generateKey(), ingredientId: null, quantity: "", unit: "g" },
  ]);

  // Controle do picker inline
  const [activePickerRow, setActivePickerRow] = useState<string | null>(null);
  const [activeUnitRow, setActiveUnitRow] = useState<string | null>(null);

  // Carrega ingredientes do banco
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const result = await db.select().from(ingredientsTable);
        setAvailableIngredients(result);
      } catch (err) {
        console.error("Erro ao carregar ingredientes:", err);
      }
    };
    loadIngredients();
  }, []);

  // ─── Gerenciamento de linhas ─────────────────────────

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { key: generateKey(), ingredientId: null, quantity: "", unit: "g" },
    ]);
  };

  const removeRow = (key: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key: string, field: keyof IngredientRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const selectIngredient = (rowKey: string, ingredient: Ingredient) => {
    updateRow(rowKey, "ingredientId", ingredient.id);
    updateRow(rowKey, "unit", ingredient.defaultUnit);
    setActivePickerRow(null);
  };

  // ─── Validação e salvamento ──────────────────────────

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert("Erro", "Informe o nome da receita.");
      return false;
    }

    const qty = parseInt(yieldQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Erro", "O rendimento deve ser um número maior que zero.");
      return false;
    }

    const validRows = rows.filter((r) => r.ingredientId !== null);
    if (validRows.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um ingrediente à receita.");
      return false;
    }

    for (const row of validRows) {
      const amount = parseFloat(row.quantity.replace(",", "."));
      if (isNaN(amount) || amount <= 0) {
        const ing = availableIngredients.find(
          (i) => i.id === row.ingredientId
        );
        Alert.alert(
          "Erro",
          `Informe a quantidade para "${ing?.name ?? "ingrediente"}".`
        );
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const qty = parseInt(yieldQty, 10);

      // Insere a receita
      const [newRecipe] = await db
        .insert(recipes)
        .values({
          name: name.trim(),
          yieldQuantity: qty,
          notes: notes.trim() || null,
        })
        .returning({ id: recipes.id });

      // Insere os ingredientes da receita
      const validRows = rows.filter((r) => r.ingredientId !== null);
      for (const row of validRows) {
        await db.insert(recipeIngredients).values({
          recipeId: newRecipe.id,
          ingredientId: row.ingredientId!,
          quantity: parseFloat(row.quantity.replace(",", ".")),
          unit: row.unit,
        });
      }

      Alert.alert("Sucesso", "Receita criada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Erro ao salvar receita:", err);
      Alert.alert("Erro", "Não foi possível salvar a receita.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers de renderização ─────────────────────────

  const getIngredientName = (id: number | null) => {
    if (!id) return null;
    return availableIngredients.find((i) => i.id === id)?.name ?? null;
  };

  // ─── Render ──────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-background px-5 pt-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Nome da Receita */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Nome da Receita *
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: Bolo de Chocolate"
            placeholderTextColor="#D89A92"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Rendimento */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Rendimento (unidades) *
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Ex: 10"
            placeholderTextColor="#D89A92"
            value={yieldQty}
            onChangeText={setYieldQty}
            keyboardType="number-pad"
          />
        </View>

        {/* Observações */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Observações
          </Text>
          <TextInput
            className="min-h-[80px] rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Modo de preparo, dicas..."
            placeholderTextColor="#D89A92"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ─── Seção de Ingredientes ─── */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-primary">
            🧂 Ingredientes da Receita
          </Text>
          <Pressable
            onPress={addRow}
            className="rounded-lg bg-secondary/20 px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-primary">
              + Adicionar
            </Text>
          </Pressable>
        </View>

        {availableIngredients.length === 0 && (
          <View className="mb-4 rounded-xl border border-secondary/30 bg-white p-4">
            <Text className="text-center text-sm text-secondary">
              ⚠️ Nenhum ingrediente cadastrado.{"\n"}
              Registre uma compra primeiro para criar ingredientes no sistema.
            </Text>
          </View>
        )}

        {rows.map((row, index) => (
          <View
            key={row.key}
            className="mb-3 rounded-xl border border-secondary/20 bg-white p-3"
          >
            {/* Header da linha */}
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-secondary">
                Ingrediente #{index + 1}
              </Text>
              {rows.length > 1 && (
                <Pressable
                  onPress={() => removeRow(row.key)}
                  className="rounded-md bg-red-50 px-2 py-0.5 active:opacity-70"
                >
                  <Text className="text-xs text-red-500">Remover</Text>
                </Pressable>
              )}
            </View>

            {/* Seletor de ingrediente (inline) */}
            <Pressable
              onPress={() =>
                setActivePickerRow(
                  activePickerRow === row.key ? null : row.key
                )
              }
              className="mb-2 rounded-lg border border-secondary/30 bg-background px-3 py-2.5"
            >
              <Text
                className={
                  getIngredientName(row.ingredientId)
                    ? "text-sm text-primary"
                    : "text-sm text-secondary"
                }
              >
                {getIngredientName(row.ingredientId) ??
                  "Toque para selecionar..."}
              </Text>
            </Pressable>

            {/* Dropdown de ingredientes */}
            {activePickerRow === row.key && (
              <View className="mb-2 max-h-40 rounded-lg border border-secondary/30 bg-white">
                <ScrollView nestedScrollEnabled>
                  {availableIngredients.map((ing) => (
                    <Pressable
                      key={ing.id}
                      onPress={() => selectIngredient(row.key, ing)}
                      className="border-b border-secondary/10 px-3 py-2.5 active:bg-background"
                    >
                      <Text className="text-sm text-primary">{ing.name}</Text>
                      <Text className="text-xs text-secondary">
                        Unidade padrão: {ing.defaultUnit}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Quantidade + Unidade */}
            <View className="flex-row gap-2">
              <View className="flex-1">
                <TextInput
                  className="rounded-lg border border-secondary/30 bg-background px-3 py-2 text-sm text-primary"
                  placeholder="Qtd"
                  placeholderTextColor="#D89A92"
                  value={row.quantity}
                  onChangeText={(v) => updateRow(row.key, "quantity", v)}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Seletor de unidade */}
              <Pressable
                onPress={() =>
                  setActiveUnitRow(
                    activeUnitRow === row.key ? null : row.key
                  )
                }
                className="w-20 items-center justify-center rounded-lg border border-secondary/30 bg-background px-2 py-2"
              >
                <Text className="text-sm font-semibold text-primary">
                  {row.unit}
                </Text>
              </Pressable>
            </View>

            {/* Dropdown de unidades */}
            {activeUnitRow === row.key && (
              <View className="mt-2 flex-row flex-wrap gap-2">
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => {
                      updateRow(row.key, "unit", u);
                      setActiveUnitRow(null);
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      row.unit === u
                        ? "bg-primary"
                        : "border border-secondary/30 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        row.unit === u ? "text-white" : "text-primary"
                      }`}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Botão Salvar */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="mb-6 mt-4 items-center rounded-xl bg-primary py-4 active:opacity-80"
          style={saving ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {saving ? "Salvando..." : "Criar Receita"}
          </Text>
        </Pressable>

        {/* Spacer */}
        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
