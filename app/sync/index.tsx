import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// INSTRUÇÕES PARA O USUÁRIO (Nuvem):
// Para o login do Google funcionar perfeitamente em modo desenvolvimento no Expo Go:
// Você precisará de um Web Client ID criado no painel do Google Cloud Credentials.
const GOOGLE_CLIENT_ID = "SEU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com"; 

const DB_NAME = "delicias_da_noemia.db";
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
const DRIVE_FILE_NAME = "backup_delicias_da_noemia.db";

export default function SyncScreen() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
    redirectUri,
    responseType: "token",
  });

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await SecureStore.getItemAsync("google_drive_token");
      if (savedToken) setAccessToken(savedToken);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { access_token } = response.params;
      setAccessToken(access_token);
      SecureStore.setItemAsync("google_drive_token", access_token);
    }
  }, [response]);

  const handleLogout = async () => {
    setAccessToken(null);
    await SecureStore.deleteItemAsync("google_drive_token");
  };

  // 1. Busca se já existe um backup no Drive
  const findBackupFileId = async (token: string): Promise<string | null> => {
    const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  };

  // 2. Faz o Upload
  const handleBackup = async () => {
    if (!accessToken) return;
    setLoading(true);
    setStatusText("Preparando arquivo...");

    try {
      const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
      if (!fileInfo.exists) {
        throw new Error("Banco de dados local não encontrado.");
      }

      setStatusText("Verificando nuvem...");
      const existingFileId = await findBackupFileId(accessToken);

      setStatusText("Enviando para o Google Drive...");

      const formData = new FormData();
      if (!existingFileId) {
        // Arquivo novo: manda metadata de criação
        formData.append(
          "metadata",
          new Blob([JSON.stringify({ name: DRIVE_FILE_NAME })], { type: "application/json" })
        );
      }
      
      formData.append("file", {
        uri: DB_PATH,
        name: DRIVE_FILE_NAME,
        type: "application/octet-stream",
      } as any);

      const url = existingFileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
        : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

      const method = existingFileId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Falha no upload: ${errText}`);
      }

      setStatusText("");
      Alert.alert("Sucesso", "Backup salvo no Google Drive com segurança!");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Erro", err.message || "Ocorreu um erro no backup.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  // 3. Faz o Download (Restore)
  const handleRestore = async () => {
    if (!accessToken) return;

    Alert.alert(
      "Atenção",
      "Restaurar o backup apagará todos os dados locais atuais. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            setStatusText("Buscando backup...");

            try {
              const fileId = await findBackupFileId(accessToken);
              if (!fileId) {
                throw new Error("Nenhum backup encontrado no seu Google Drive.");
              }

              setStatusText("Baixando dados...");
              const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

              // Certifique-se que o diretório SQLite existe
              const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
              const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
              if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
              }

              const { status } = await FileSystem.downloadAsync(url, DB_PATH, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });

              if (status !== 200) {
                throw new Error("Falha ao baixar o arquivo.");
              }

              setStatusText("");
              Alert.alert(
                "Backup Restaurado",
                "Os dados foram restaurados com sucesso! Reinicie o aplicativo para recarregar o banco de dados.",
                [{ text: "OK", onPress: () => router.replace("/") }]
              );
            } catch (err: any) {
              console.error(err);
              Alert.alert("Erro", err.message || "Ocorreu um erro na restauração.");
            } finally {
              setLoading(false);
              setStatusText("");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background px-5 pt-10">
      <View className="mb-8 items-center">
        <Text className="text-6xl mb-4">☁️</Text>
        <Text className="text-2xl font-bold text-primary">Backup e Nuvem</Text>
        <Text className="text-center text-sm text-secondary mt-2">
          Salve seus dados no Google Drive para não perder nada ou para sincronizar entre aparelhos.
        </Text>
      </View>

      {!accessToken ? (
        <View className="flex-1 items-center justify-center">
          <Pressable
            onPress={() => promptAsync()}
            disabled={!request}
            className="w-full flex-row items-center justify-center rounded-2xl bg-blue-600 py-4 active:opacity-80"
          >
            <Text className="text-lg font-bold text-white">Conectar com Google Drive</Text>
          </Pressable>
          <Text className="mt-4 text-center text-xs text-secondary px-4">
            Ao conectar, o aplicativo pedirá permissão apenas para gerenciar os arquivos criados por ele mesmo.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="mb-6 rounded-2xl bg-white border border-secondary/20 p-5 items-center">
            <Text className="text-sm font-semibold text-green-600 mb-1">
              ✅ Conectado ao Google Drive
            </Text>
            <Pressable onPress={handleLogout} className="mt-2 py-2 px-4 rounded bg-gray-100">
              <Text className="text-xs font-bold text-secondary">Desconectar</Text>
            </Pressable>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#4A2B20" />
              <Text className="mt-4 text-sm font-semibold text-primary">{statusText}</Text>
            </View>
          ) : (
            <View className="gap-4">
              <Pressable
                onPress={handleBackup}
                className="flex-row items-center justify-between rounded-2xl bg-primary p-5 active:opacity-80"
              >
                <View>
                  <Text className="text-lg font-bold text-white">Salvar no Drive</Text>
                  <Text className="text-sm text-white/80">Cria ou atualiza seu backup</Text>
                </View>
                <Text className="text-3xl">⬆️</Text>
              </Pressable>

              <Pressable
                onPress={handleRestore}
                className="flex-row items-center justify-between rounded-2xl border-2 border-primary bg-background p-5 active:opacity-80"
              >
                <View>
                  <Text className="text-lg font-bold text-primary">Restaurar Backup</Text>
                  <Text className="text-sm text-secondary">Substitui os dados locais</Text>
                </View>
                <Text className="text-3xl">⬇️</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
