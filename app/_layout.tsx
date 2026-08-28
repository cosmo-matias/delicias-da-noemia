import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
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
      />
    </>
  );
}
