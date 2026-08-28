import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { ComprasRepository } from "../db/repositories/compras";
import type { Insumo } from "../db/schema";

type ModalInsumoProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: (novoInsumo: Insumo) => void;
};

const UNIDADES = ["kg", "g", "L", "ml", "un"];

export default function ModalInsumo({
  visible,
  onClose,
  onSuccess,
}: ModalInsumoProps) {
  const [saving, setSaving] = useState(false);
  
  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("kg");
  const [quantidadeMedida, setQuantidadeMedida] = useState("");
  const [isPacote, setIsPacote] = useState(false);
  const [itensPorPacote, setItensPorPacote] = useState("");

  const resetForm = () => {
    setNome("");
    setMarca("");
    setUnidadeMedida("kg");
    setQuantidadeMedida("");
    setIsPacote(false);
    setItensPorPacote("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do insumo é obrigatório.");
      return;
    }
    
    if (!quantidadeMedida.trim() || isNaN(parseFloat(quantidadeMedida.replace(",", ".")))) {
      Alert.alert("Erro", "Informe uma quantidade válida para a medida.");
      return;
    }

    if (isPacote && (!itensPorPacote.trim() || isNaN(parseInt(itensPorPacote, 10)))) {
      Alert.alert("Erro", "Informe a quantidade de itens no pacote.");
      return;
    }

    setSaving(true);
    try {
      const novoInsumo = await ComprasRepository.cadastrarInsumo(
        nome.trim(),
        unidadeMedida,
        marca.trim() || undefined,
        parseFloat(quantidadeMedida.replace(",", ".")),
        isPacote ? parseInt(itensPorPacote, 10) : undefined
      );

      Alert.alert("Sucesso", "Insumo cadastrado com sucesso!");
      onSuccess(novoInsumo);
      handleClose();
    } catch (error) {
      console.error("Erro ao cadastrar insumo:", error);
      Alert.alert("Erro", "Não foi possível cadastrar o insumo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end bg-black/50"
      >
        <View className="max-h-[90%] rounded-t-3xl bg-background p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-primary">Novo Insumo</Text>
            <Pressable onPress={handleClose} className="p-2">
              <Text className="text-lg font-bold text-secondary">X</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nome */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-primary">
                Nome do Item *
              </Text>
              <TextInput
                className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
                placeholder="Ex: Farinha de Trigo"
                placeholderTextColor="#D89A92"
                value={nome}
                onChangeText={setNome}
              />
            </View>

            {/* Marca */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-primary">
                Marca (Opcional)
              </Text>
              <TextInput
                className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
                placeholder="Ex: Dona Benta"
                placeholderTextColor="#D89A92"
                value={marca}
                onChangeText={setMarca}
              />
            </View>

            {/* Unidade de Medida */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-primary">
                Unidade de Medida *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {UNIDADES.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnidadeMedida(u)}
                    className={`rounded-full px-4 py-2 ${
                      unidadeMedida === u ? "bg-primary" : "bg-white border border-secondary/40"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        unidadeMedida === u ? "text-white" : "text-primary"
                      }`}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Quantidade na Medida */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-primary">
                Quantidade na Medida (ex: 1 para 1kg, 5 para 5kg) *
              </Text>
              <TextInput
                className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
                placeholder="Ex: 1"
                placeholderTextColor="#D89A92"
                value={quantidadeMedida}
                onChangeText={setQuantidadeMedida}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Switch Pacote Fechado */}
            <View className="mb-4 flex-row items-center justify-between rounded-xl bg-white p-4 border border-secondary/20">
              <Text className="text-sm font-semibold text-primary">
                É um fardo / pacote fechado?
              </Text>
              <Switch
                value={isPacote}
                onValueChange={setIsPacote}
                trackColor={{ false: "#E5E5E5", true: "#4A2B20" }}
                thumbColor={"#FFFFFF"}
              />
            </View>

            {/* Itens por Pacote */}
            {isPacote && (
              <View className="mb-4">
                <Text className="mb-2 text-sm font-semibold text-primary">
                  Quantidade de itens no pacote *
                </Text>
                <TextInput
                  className="rounded-xl border border-secondary/40 bg-white px-4 py-3 text-base text-primary"
                  placeholder="Ex: 10"
                  placeholderTextColor="#D89A92"
                  value={itensPorPacote}
                  onChangeText={setItensPorPacote}
                  keyboardType="number-pad"
                />
              </View>
            )}

            {/* Botão Salvar */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="mt-2 mb-8 items-center rounded-xl bg-primary py-4 active:opacity-80"
              style={saving ? { opacity: 0.6 } : undefined}
            >
              <Text className="text-base font-bold text-white">
                {saving ? "Salvando..." : "Cadastrar Insumo"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
