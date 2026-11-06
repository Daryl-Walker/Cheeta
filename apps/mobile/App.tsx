import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import type { DashboardSnapshot } from "@cheeta/contracts";

WebBrowser.maybeCompleteAuthSession();

const extra = Constants.expoConfig?.extra ?? {};
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? String(extra.apiUrl ?? "http://localhost:4000");
const clientId = process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID ?? String(extra.entraClientId ?? "");
const authority = process.env.EXPO_PUBLIC_ENTRA_AUTHORITY ?? String(extra.entraAuthority ?? "");
const issuer = process.env.EXPO_PUBLIC_ENTRA_ISSUER ?? String(extra.entraIssuer ?? "");
const apiScope = process.env.EXPO_PUBLIC_ENTRA_API_SCOPE ?? String(extra.entraApiScope ?? "");
export default function App() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "cheeta" });
  const discovery = AuthSession.useAutoDiscovery(authority || "https://login.microsoftonline.com/common/v2.0");
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId,
    redirectUri,
    scopes: ["openid", "profile", "offline_access", ...(apiScope ? [apiScope] : [])],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true
  }, discovery);
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [apiKeyId, setApiKeyId] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [busy, setBusy] = useState(false);
  const authConfigured = Boolean(clientId && authority && issuer && apiScope);

  useEffect(() => {
    if (response?.type === "success") {
      const code = response.params.code;
      if (!code || !request?.codeVerifier || !discovery) return;
      AuthSession.exchangeCodeAsync({
        clientId,
        code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier }
      }, discovery).then((result) => {
        if (result.accessToken) setToken(result.accessToken);
      }).catch(() => Alert.alert("Sign-in failed", "Entra External ID token exchange failed."));
    }
  }, [response, request, discovery, redirectUri]);

  const headers = useMemo(() => ({
    "content-type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {})
  }), [token]);

  async function linkKalshi() {
    const localHttp = /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?(?:\/|$)/i.test(apiUrl);
    if (!apiUrl.startsWith("https://") && !localHttp) {
      Alert.alert("Insecure API URL", "Use HTTPS when connecting outside local development.");
      return;
    }
    if (!apiKeyId.trim() || !privateKeyPem.includes("PRIVATE KEY")) {
      Alert.alert("Missing credentials", "Enter your Kalshi API key ID and private key.");
      return;
    }
    setBusy(true);
    try {
      const result = await fetch(`${apiUrl}/api/providers/kalshi/link`, {
        method: "POST",
        headers,
        body: JSON.stringify({ apiKeyId: apiKeyId.trim(), privateKeyPem })
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "Could not link Kalshi.");
      setDashboard(body.dashboard as DashboardSnapshot);
      setApiKeyId("");
      setPrivateKeyPem("");
    } catch (error) {
      Alert.alert("Could not link account", error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    try {
      const result = await fetch(`${apiUrl}/api/account/dashboard`, { headers });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error ?? "Dashboard refresh failed.");
      setDashboard(body as DashboardSnapshot);
    } catch (error) {
      Alert.alert("Refresh failed", error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return <SafeAreaView style={styles.center}>
      <Text style={styles.brand}>cheeta</Text>
      <Text style={styles.muted}>A read-only view of your linked account.</Text>
      {authConfigured ? <Pressable disabled={!request} style={styles.primary} onPress={() => promptAsync()}>
        <Text style={styles.primaryText}>Sign in</Text>
      </Pressable> : <Text style={styles.warning}>Configure Entra External ID in apps/mobile/app.json to enable sign-in.</Text>}
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View><Text style={styles.brand}>cheeta</Text><Text style={styles.muted}>Your read-only dashboard</Text></View>
        <Pressable onPress={refresh} style={styles.refresh}><Text style={styles.refreshText}>Refresh</Text></Pressable>
      </View>
      {busy && <ActivityIndicator color="#2864dc" />}
      {dashboard ? <>
        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balance}>${dashboard.account.availableBalance.toFixed(2)}</Text>
          <Text style={styles.muted}>Synced {new Date(dashboard.account.syncedAt).toLocaleString()}</Text>
        </View>
        <Text style={styles.section}>Open markets</Text>
        {dashboard.markets.map((market) => <View key={market.ticker} style={styles.row}>
          <View style={styles.grow}><Text style={styles.rowTitle}>{market.title}</Text><Text style={styles.muted}>{market.ticker}</Text></View>
          <Text style={styles.price}>{market.yesBid === null ? "—" : `${Math.round(market.yesBid * 100)}¢`}</Text>
        </View>)}
        <Text style={styles.section}>Positions</Text>
        {dashboard.account.positions.length === 0 ? <Text style={styles.muted}>No positions reported.</Text> :
          dashboard.account.positions.map((position) => <View key={position.ticker} style={styles.row}>
            <View style={styles.grow}><Text style={styles.rowTitle}>{position.marketTitle}</Text><Text style={styles.muted}>{position.ticker}</Text></View>
            <Text style={styles.price}>{position.position}</Text>
          </View>)}
      </> : <View style={styles.panel}>
        <Text style={styles.section}>Connect Kalshi</Text>
        <Text style={styles.muted}>Credentials are sent to the Cheeta API over HTTPS and are not saved on this device. The API stores them server-side.</Text>
        <TextInput value={apiKeyId} onChangeText={setApiKeyId} placeholder="Kalshi API key ID" autoCapitalize="none" style={styles.input} />
        <TextInput value={privateKeyPem} onChangeText={setPrivateKeyPem} placeholder="Private key PEM" multiline secureTextEntry style={[styles.input, styles.keyInput]} />
        <Pressable disabled={busy} onPress={linkKalshi} style={styles.primary}><Text style={styles.primaryText}>Connect read-only account</Text></Pressable>
      </View>}
      <Text style={styles.disclaimer}>Read-only dashboard. Cheeta cannot place or modify orders.</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, backgroundColor: "#f4f7fb" },
  page: { flex: 1, backgroundColor: "#f4f7fb" },
  content: { padding: 22, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  brand: { fontSize: 30, fontWeight: "800", color: "#142238", letterSpacing: -1 },
  muted: { color: "#6d7b91", fontSize: 13, lineHeight: 19 },
  warning: { color: "#8b5a00", marginTop: 16, textAlign: "center" },
  primary: { backgroundColor: "#2864dc", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 14 },
  primaryText: { color: "white", fontWeight: "700" },
  refresh: { padding: 11 },
  refreshText: { color: "#2864dc", fontWeight: "700" },
  balanceCard: { backgroundColor: "#142238", borderRadius: 18, padding: 22, gap: 8 },
  cardLabel: { color: "#a9bad1", fontSize: 11, letterSpacing: 1, fontWeight: "700" },
  balance: { color: "white", fontSize: 38, fontWeight: "700" },
  section: { fontSize: 19, fontWeight: "700", color: "#142238", marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 15, borderRadius: 13, gap: 10 },
  grow: { flex: 1 },
  rowTitle: { color: "#142238", fontWeight: "600" },
  price: { color: "#2864dc", fontWeight: "700" },
  panel: { backgroundColor: "white", borderRadius: 18, padding: 18 },
  input: { borderWidth: 1, borderColor: "#dce3ed", borderRadius: 10, padding: 12, marginTop: 12, color: "#142238" },
  keyInput: { height: 110, textAlignVertical: "top" },
  disclaimer: { textAlign: "center", color: "#8290a4", fontSize: 12, marginVertical: 16 }
});
