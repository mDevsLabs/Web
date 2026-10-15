import {
  ArrowUpRight,
  Globe2,
  Plus,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import type { BrowserSession } from "../../../../packages/domain/src";
import { browserAddress } from "../browser-address";
import {
  Button,
  Card,
  Chip,
  colors,
  Empty,
  ErrorNotice,
  SectionHeading,
  s,
} from "../ui";
import { useWorkspace } from "../workspace";

export function BrowserScreen() {
  const { workspace: w, api, refresh, open } = useWorkspace();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setError("");
    setBusy(true);
    try {
      const browser = await api.request<BrowserSession>("/api/browsers", {
        url: browserAddress(url),
      });
      await refresh();
      setUrl("");
      open({ type: "browser", browser });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 22 }}>
      <Card style={{ backgroundColor: colors.sky }}>
        <View style={[s.row, { gap: 12, marginBottom: 15 }]}>
          <Globe2 size={22} color={colors.blueDark} />
          <View>
            <Text style={s.heading}>A place for your open tabs</Text>
            <Text style={s.muted}>Browse in a private, persistent workspace session.</Text>
          </View>
        </View>
        <View style={[s.row, { gap: 10 }]}>
          <TextInput
            accessibilityLabel="Website address"
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={() => void create()}
            autoCapitalize="none"
            placeholder="https://example.com"
            placeholderTextColor={colors.muted}
            style={[s.input, { flex: 1 }]}
          />
          <Button
            primary
            icon={Plus}
            busy={busy}
            disabled={!url.trim()}
            onPress={() => void create()}
          >
            Open session
          </Button>
        </View>
        <ErrorNotice error={error} />
      </Card>
      <Card>
        <SectionHeading title="Browser sessions" />
        {w.browsers.length ? (
          w.browsers.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => open({ type: "browser", browser: b })}
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.line,
                paddingVertical: 20,
                gap: 12,
              }}
            >
              <View style={[s.row, { gap: 14 }]}>
                <View style={s.iconBox}>
                  <Globe2 size={20} color={colors.blueDark} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={s.heading}>{b.title || "Browser session"}</Text>
                  <Text style={s.muted} numberOfLines={1}>
                    {b.url}
                  </Text>
                </View>
                <Chip tint={b.status === "active" ? colors.green : colors.canvas}>{b.status}</Chip>
                <ArrowUpRight size={17} color={colors.muted} />
              </View>
              {!!b.previewUrl && (
                <Image
                  source={{ uri: api.url(b.previewUrl) }}
                  resizeMode="cover"
                  style={{
                    height: 180,
                    width: "100%",
                    borderRadius: 12,
                    backgroundColor: colors.canvas,
                  }}
                />
              )}
            </Pressable>
          ))
        ) : (
          <Empty
            icon={Globe2}
            title="Start with a website"
            detail="Open a session above to keep your browsing together. Live previews appear when the browser worker is configured."
          />
        )}
      </Card>
    </View>
  );
}
