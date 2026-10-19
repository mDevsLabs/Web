import {
  ArrowDownToLine,
  CalendarDays,
  ChevronRight,
  Globe2,
  Link2,
  Mail,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Button, Chip, colors, ErrorNotice, s, Sheet } from "../ui";
import { useWorkspace } from "../workspace";

function SettingsLine({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={[
        s.between,
        { gap: 15, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
      ]}
    >
      <Text style={s.muted}>{label}</Text>
      <Text style={[s.text, { fontSize: 12, flexShrink: 1, textAlign: "right" }]}>{value}</Text>
    </View>
  );
}

function capabilityLabel(value: string) {
  const scope = value.split("/").at(-1) || value;
  const names: Record<string, string> = {
    "gmail.readonly": "Read Gmail",
    "gmail.send": "Send Gmail",
    "calendar.events.readonly": "Read calendar events",
    "calendar.calendarlist.readonly": "Read calendar list",
    "calendar.events": "Manage calendar events",
    "calendar.readonly": "Read calendars",
  };
  return names[scope] || scope;
}

export function ConnectionsScreen({ query = "" }: { query?: string }) {
  const { workspace: w, api, refresh, notify, open } = useWorkspace();
  const [selected, setSelected] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function connect(capability: "read" | "write") {
    setBusy(true);
    setError("");
    try {
      const result = await api.request<{ url: string | null; connected?: boolean }>(
        "/api/google/connect",
        { capability },
      );
      if (result.url) {
        await Linking.openURL(result.url);
        notify("Finish connecting in your browser, then refresh your workspace.");
      } else {
        await refresh();
        notify("Local Google data is ready.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError("");
    try {
      await api.request("/api/google/disconnect", {});
      await refresh();
      notify("Google disconnected.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const google = w.connections.find((c) => c.id === "google");
  const connected = google?.status === "connected" || google?.status === "sample";
  const rows = [
    { id: "gmail", name: "Gmail", icon: Mail, color: "#EA5B4D", connected, group: "google" },
    {
      id: "calendar",
      name: "Google Calendar",
      icon: CalendarDays,
      color: "#4285F4",
      connected,
      group: "google",
    },
    {
      id: "browser",
      name: "Agent computer",
      icon: Globe2,
      color: "#1987CF",
      connected: w.connections.some((c) => c.id === "browser" && c.status === "connected"),
      group: "browser",
    },
    {
      id: "openbot",
      name: "OpenBot",
      icon: Sparkles,
      color: "#6866A6",
      connected: false,
      group: "openbot",
    },
  ].filter((row) => `${row.name} ${row.group}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={{ gap: 22 }}>
      {[true, false].map((isConnected) => {
        const group = rows.filter((row) => row.connected === isConnected);
        if (!group.length) return null;
        return (
          <View key={String(isConnected)} style={{ gap: 8 }}>
            <Text style={[s.small, { marginLeft: 12 }]}>
              {isConnected
                ? w.mode === "sample"
                  ? "Your connections"
                  : "Connected"
                : "Available integrations"}
            </Text>
            <View style={{ paddingHorizontal: 16, borderRadius: 23, backgroundColor: "#F3F4F5" }}>
              {group.map((row, index) => (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Manage ${row.name}`}
                  onPress={() =>
                    row.group === "browser" ? open({ type: "computer" }) : setSelected(row.group)
                  }
                  style={[
                    s.row,
                    {
                      gap: 14,
                      minHeight: 61,
                      borderBottomWidth: index < group.length - 1 ? 1 : 0,
                      borderBottomColor: "#E5E7E9",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 29,
                      height: 29,
                      borderRadius: 7,
                      backgroundColor: "#FFF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <row.icon size={23} color={row.color} />
                  </View>
                  <Text style={[s.text, { flex: 1 }]}>{row.name}</Text>
                  {row.connected && row.group === "google" && w.mode === "sample" && (
                    <Text style={s.small}>Local data</Text>
                  )}
                  {row.connected ? (
                    <ChevronRight size={18} color="#A4A7AA" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 13,
                        color: row.group === "google" ? colors.blueDark : colors.muted,
                      }}
                    >
                      {row.group === "google" ? "Connect" : "Setup"}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
      {!rows.length && <Text style={s.muted}>No matching connectors.</Text>}
      {selected && (
        <Sheet
          title={selected === "google" ? "Google connections" : "OpenBot"}
          subtitle={selected === "google" ? google?.account : "A computer for your agent"}
          onClose={() => setSelected(undefined)}
        >
          {selected === "google" ? (
            <View style={{ gap: 18 }}>
              <Text style={s.muted}>
                Bring Gmail and Google Calendar into your conversations. Choose read access, then
                enable sending and editing when you need it.
              </Text>
              <View style={[s.row, { gap: 7, flexWrap: "wrap" }]}>
                {google?.capabilities.map((cap) => (
                  <Chip key={cap}>{capabilityLabel(cap)}</Chip>
                ))}
              </View>
              <ErrorNotice error={error} />
              <Button busy={busy} primary icon={Link2} onPress={() => void connect("read")}>
                Connect Google
              </Button>
              <Button busy={busy} onPress={() => void connect("write")}>
                Enable sending & editing
              </Button>
              {connected && (
                <Button busy={busy} danger onPress={() => void disconnect()}>
                  Disconnect Google
                </Button>
              )}
              <SettingsLine
                label="Environment"
                value={w.mode === "sample" ? "Local · example data" : "Live workspace"}
              />
              <SettingsLine
                label="Assistant"
                value={
                  w.runtime.provider === "sample"
                    ? "Guided workflows"
                    : w.runtime.configured
                      ? "Model connected"
                      : "Model not configured"
                }
              />
              <SettingsLine
                label="Rich Threads"
                value={w.runtime.richThreads ? "CopilotKit Intelligence" : "Not connected"}
              />
              <Button
                small
                icon={ArrowDownToLine}
                onPress={() => void refresh().catch((e) => setError(String(e)))}
              >
                Refresh connections
              </Button>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Text style={s.text}>
                The OpenBot adapter is available in this open-source project. A live OpenBot backend
                has not been configured.
              </Text>
              <Text style={s.muted}>
                Your current computer uses OpenMuse’s persistent Chromium worker. OpenBot
                integration will expand the execution backend while keeping this interface.
              </Text>
            </View>
          )}
        </Sheet>
      )}
    </View>
  );
}
