import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

type MenuButton = {
  label: string;
  subtitle: string;
  route: string;
  emoji: string;
  enabled: boolean;
};

const MENU_ITEMS: MenuButton[] = [
  {
    label: "Compras",
    subtitle: "Registrar e consultar compras de insumos",
    route: "/purchases",
    emoji: "🛒",
    enabled: true,
  },
  {
    label: "Receitas",
    subtitle: "Cadastrar fichas técnicas",
    route: "/recipes",
    emoji: "📋",
    enabled: true,
  },
  {
    label: "Produtos",
    subtitle: "Precificação e catálogo",
    route: "/products",
    emoji: "🧁",
    enabled: true,
  },
  {
    label: "Vendas",
    subtitle: "Registro e fechamento diário",
    route: "/sales",
    emoji: "💰",
    enabled: true,
  },
  {
    label: "Dashboard",
    subtitle: "Resumo e indicadores",
    route: "/dashboard",
    emoji: "📊",
    enabled: false,
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background px-5 pt-8">
      {/* Header */}
      <View className="mb-8 items-center">
        <Text className="text-3xl font-bold text-primary">
          Delícias da Noêmia
        </Text>
        <Text className="mt-1 text-base text-secondary">
          Sistema de Gestão de Confeitaria
        </Text>
      </View>

      {/* Menu Grid */}
      <View className="gap-4">
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => {
              if (item.enabled) {
                router.push(item.route as any);
              }
            }}
            disabled={!item.enabled}
            className="flex-row items-center rounded-2xl border border-secondary/30 bg-white p-4 active:opacity-80"
            style={!item.enabled ? { opacity: 0.45 } : undefined}
          >
            <Text className="text-3xl">{item.emoji}</Text>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-semibold text-primary">
                {item.label}
              </Text>
              <Text className="text-sm text-secondary">
                {item.subtitle}
              </Text>
            </View>
            {item.enabled ? (
              <Text className="text-xl text-secondary">›</Text>
            ) : (
              <View className="rounded-full bg-secondary/20 px-2 py-0.5">
                <Text className="text-xs text-primary/60">Em breve</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
