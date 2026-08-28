import { useState } from "react";
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
import { purchases } from "../../db/schema";

export default function NewPurchaseScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Campos do formulário
  const [date, setDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");

  const formatDateInput = (text: string) => {
    // Remove tudo que não for número
    const digits = text.replace(/\D/g, "");
    // Aplica a máscara DD/MM/AAAA
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  };

  const displayDate = () => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleDateChange = (text: string) => {
    const formatted = formatDateInput(text);
    // Converte de DD/MM/AAAA para AAAA-MM-DD internamente
    const digits = text.replace(/\D/g, "");
    if (digits.length === 8) {
      const dd = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      setDate(`${yyyy}-${mm}-${dd}`);
    } else {
      // Enquanto digita, armazena o texto formatado temporariamente
      setDate(formatted);
    }
  };

  const validateForm = (): boolean => {
    if (!date || date.length !== 10 || !date.includes("-")) {
      Alert.alert("Erro", "Informe uma data válida (DD/MM/AAAA).");
      return false;
    }

    const amount = parseFloat(totalAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Erro", "Informe um valor total válido.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const amount = parseFloat(totalAmount.replace(",", "."));

      await db.insert(purchases).values({
        date,
        totalAmount: amount,
        notes: notes.trim() || null,
      });

      Alert.alert("Sucesso", "Compra registrada com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error("Erro ao salvar compra:", err);
      Alert.alert("Erro", "Não foi possível salvar a compra.");
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
        {/* Data */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Data da Compra *
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#D89A92"
            value={displayDate()}
            onChangeText={handleDateChange}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Valor Total */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Valor Total (R$) *
          </Text>
          <TextInput
            className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="0,00"
            placeholderTextColor="#D89A92"
            value={totalAmount}
            onChangeText={setTotalAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Observações */}
        <View className="mb-8">
          <Text className="mb-2 text-sm font-semibold text-primary">
            Observações
          </Text>
          <TextInput
            className="min-h-[100px] rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
            placeholder="Loja, promoções, observações..."
            placeholderTextColor="#D89A92"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Botão Salvar */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="mb-6 items-center rounded-xl bg-primary py-4 active:opacity-80"
          style={saving ? { opacity: 0.6 } : undefined}
        >
          <Text className="text-base font-bold text-white">
            {saving ? "Salvando..." : "Registrar Compra"}
          </Text>
        </Pressable>

        {/* Info */}
        <View className="mb-10 rounded-xl border border-secondary/20 bg-white p-4">
          <Text className="text-xs text-secondary">
            💡 Na próxima fase, você poderá adicionar itens individuais
            (ingredientes, quantidades e preços) a cada compra.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
