import { Platform } from "react-native";

if (Platform.OS === "web" && typeof SharedArrayBuffer === "undefined") {
  (global as any).SharedArrayBuffer = ArrayBuffer;
}
