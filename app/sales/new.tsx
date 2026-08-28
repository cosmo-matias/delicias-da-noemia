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
import { sales, saleItems, products as productsTable } from "../../db/schema";
import type { Product } from "../../db/schema";

type SaleRow = {
  key: string;
  productId: number | null;
  quantity: string;
  unitPrice: number;
};

function generateKey() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NewSaleScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Date defaults to today in DD/MM/YYYY
  const today = new Date();
  const defaultDate = `${String(today.getDate()).padStart(2, "0")}/${String(
    today.getMonth() + 1
  ).padStart(2, "0")}/${today.getFullYear()}`;

  const [date, setDate] = useState(defaultDate);
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<SaleRow[]>([
    { key: generateKey(), productId: null, quantity: "1", unitPrice: 0 },
  ]);

  const [activePickerRow, setActivePickerRow] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await db.select().from(productsTable);
        setAvailableProducts(result);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      }
    };
    loadProducts();
  }, []);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { key: generateKey(), productId: null, quantity: "1", unitPrice: 0 },
    ]);
  };

  const removeRow = (key: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key: string, field: keyof SaleRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  };

  const selectProduct = (rowKey: string, product: Product) => {
    updateRow(rowKey, "productId", product.id);
    updateRow(rowKey, "unitPrice", product.salePrice);
    setActivePickerRow(null);
  };

  const getProductName = (id: number | null) => {
    if (!id) return null;
    return availableProducts.find((p) => p.id === id)?.name ?? null;
  };

  // Cálculos dinâmicos
  const subtotal = rows.reduce((acc, row) => {
    const qty = parseInt(row.quantity, 10);
    if (!isNaN(qty) && qty > 0) {
      return acc + qty * row.unitPrice;
    }
    return acc;
  }, 0);

  const discountValue = parseFloat(discount.replace(",", ".")) || 0;
  const totalAmount = Math.max(0, subtotal - discountValue);

  // Masks
  const handleDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    let masked = cleaned;
    if (cleaned.length > 2) {
      masked = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    }
    if (cleaned.length > 4) {
      masked = masked.slice(0, 5) + "/" + masked.slice(5, 9);
    }
    setDate(masked);
  };

  const validateForm = (): boolean => {
    if (date.length !== 10) {
      Alert.alert("Erro", "A data deve estar no formato DD/MM/AAAA.");
      return false;
    }

    const validRows = rows.filter((r) => r.productId !== null);
    if (validRows.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um produto vendido.");
      return false;
    }

    for (const row of validRows) {
      const qty = parseInt(row.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        Alert.alert("Erro", "Quantidade inválida para um dos produtos.");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const [d, m, y] = date.split("/");
      const isoDate = `${y}-${m}-${d}`;

      // Insere venda
      const [newSale] = await db
        .insert(sales)
        .values({
          date: isoDate,
          discount: discountValue,
          totalAmount: totalAmount,
          notes: notes.trim() || null,
        })
        .returning({ id: sales.id });

      // Insere itens
      const validRows = rows.filter((r) => r.productId !== null);
      for (const row of validRows) {
        const qty = parseInt(row.quantity, 10);
        await db.insert(saleItems).values({
          saleId: newSale.id,
          productId: row.productId!,
          quantity: qty,
          unitPrice: row.unitPrice,
          totalPrice: qty * row.unitPrice,
        });
      }

      Alert.alert("Sucesso", "Venda registrada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Erro ao registrar venda:", err);
      Alert.alert("Erro", "Não foi possível registrar a venda.");
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
        <View className="flex-row gap-4 mb-5">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-semibold text-primary">
              Data do Fechamento *
            </Text>
            <TextInput
              className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#D89A92"
              value={date}
              onChangeText={handleDateChange}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>
        </View>

        {/* Itens Vendidos */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-primary">
            🧁 Produtos Vendidos
          </Text>
          <Pressable
            onPress={addRow}
            className="rounded-lg bg-secondary/20 px-3 py-1.5 active:opacity-70"
          >
            <Text className="text-sm font-semibold text-primary">+ Adicionar</Text>
          </Pressable>
        </View>

        {availableProducts.length === 0 && (
          <View className="mb-4 rounded-xl border border-secondary/30 bg-white p-4">
            <Text className="text-center text-sm text-secondary">
              ⚠️ Nenhum produto cadastrado.
            </Text>
          </View>
        )}

        {rows.map((row, index) => (
          <View
            key={row.key}
            className="mb-3 rounded-xl border border-secondary/20 bg-white p-3"
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-secondary">
                Item #{index + 1}
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

            <Pressable
              onPress={() =>
                setActivePickerRow(activePickerRow === row.key ? null : row.key)
              }
              className="mb-2 rounded-lg border border-secondary/30 bg-background px-3 py-2.5"
            >
              <Text
                className={
                  getProductName(row.productId)
                    ? "text-sm text-primary"
                    : "text-sm text-secondary"
                }
              >
                {getProductName(row.productId) ?? "Toque para selecionar..."}
              </Text>
            </Pressable>

            {activePickerRow === row.key && (
              <View className="mb-2 max-h-40 rounded-lg border border-secondary/30 bg-white">
                <ScrollView nestedScrollEnabled>
                  {availableProducts.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => selectProduct(row.key, p)}
                      className="border-b border-secondary/10 px-3 py-2.5 active:bg-background flex-row justify-between"
                    >
                      <Text className="text-sm text-primary">{p.name}</Text>
                      <Text className="text-sm text-green-700">
                        R$ {p.salePrice.toFixed(2).replace(".", ",")}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-secondary">Qtd:</Text>
              <TextInput
                className="w-20 rounded-lg border border-secondary/30 bg-background px-3 py-2 text-sm text-primary"
                value={row.quantity}
                onChangeText={(v) => updateRow(row.key, "quantity", v)}
                keyboardType="number-pad"
              />
              <View className="flex-1 items-end">
                <Text className="text-sm font-semibold text-primary">
                  = R$ {((parseInt(row.quantity, 10) || 0) * row.unitPrice).toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Totais */}
        <View className="mt-2 mb-4 rounded-xl bg-primary/5 p-4">
          <View className="mb-2 flex-row justify-between">
            <Text className="text-sm text-secondary">Subtotal</Text>
            <Text className="text-sm text-primary">
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </Text>
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm text-secondary">Descontos / Perdas (R$)</Text>
            <TextInput
              className="w-24 rounded-lg border border-secondary/40 bg-white px-3 py-2 text-right text-sm text-primary"
              placeholder="0,00"
              placeholderTextColor="#D89A92"
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
            />
          </View>

          <View className="flex-row justify-between border-t border-secondary/20 pt-3">
            <Text className="text-base font-bold text-primary">Total Líquido</Text>
            <Text className="text-base font-bold text-green-700">
              R$ {totalAmount.toFixed(2).replace(".", ",")}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Observações
          </Text>
          <TextInput
            className="min-h-[60px] rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Pix, dinheiro..."
            placeholderTextColor="#D89A92"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="mb-6 items-center rounded-xl bg-primary py-4 active:opacity-80"
          style={saving ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {saving ? "Salvando..." : "Salvar Fechamento"}
          </Text>
        </Pressable>

        <View className="h-10" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
