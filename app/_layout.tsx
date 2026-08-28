import "../polyfill";
import "../global.css";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Text } from "react-native";
import { initDatabase } from "../db/init";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error("Erro ao inicializar banco:", err);
        setDbError(err.message);
      });
  }, []);

  if (dbError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-lg font-bold text-red-600">
          Erro no banco de dados
        </Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          {dbError}
        </Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4A2B20" />
        <Text className="mt-4 text-base text-primary">
          Iniciando banco de dados...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#FAF3EE" },
          headerTintColor: "#4A2B20",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#FAF3EE" },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Delícias da Noêmia" }}
        />
        <Stack.Screen
          name="purchases/index"
          options={{ title: "Compras" }}
        />
        <Stack.Screen
          name="purchases/new"
          options={{ title: "Nova Compra" }}
        />
        <Stack.Screen
          name="purchases/[id]"
          options={{ title: "Detalhes da Compra" }}
        />
        <Stack.Screen
          name="recipes/index"
          options={{ title: "Receitas" }}
        />
        <Stack.Screen
          name="recipes/new"
          options={{ title: "Nova Receita" }}
        />
        <Stack.Screen
          name="products/index"
          options={{ title: "Produtos" }}
        />
        <Stack.Screen
          name="products/new"
          options={{ title: "Novo Produto" }}
        />
        <Stack.Screen
          name="sales/index"
          options={{ title: "Vendas" }}
        />
        <Stack.Screen
          name="sales/new"
          options={{ title: "Nova Venda" }}
        />
        <Stack.Screen
          name="dashboard/index"
          options={{ title: "Visão Geral" }}
        />
        <Stack.Screen
          name="sync/index"
          options={{ title: "Backup e Nuvem" }}
        />
      </Stack>
    </>
  );
}
