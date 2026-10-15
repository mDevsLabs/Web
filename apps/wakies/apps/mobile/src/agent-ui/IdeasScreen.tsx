import { ArrowRight, Lightbulb, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { Idea } from "../../../../packages/domain/src/agent";
import { useAgentWorkspace } from "../agent-workspace";
import { Button, Card, Chip, colors, Empty, ErrorNotice, Field, s } from "../ui";
import { useWorkspace } from "../workspace";
import { AgentStatus, errorText, EvidenceList } from "./task-common";

function TaskLink({ taskId, onOpen }: { taskId: string; onOpen?: () => void }) {
  const { open } = useWorkspace();
  return (
    <Button
      small
      icon={ArrowRight}
      onPress={() => {
        onOpen?.();
        open({ type: "task", taskId });
      }}
    >
      View task
    </Button>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  const { mutate } = useAgentWorkspace();
  const { open } = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState(idea.prompt);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(action: "accept" | "dismiss") {
    setBusy(true);
    setError("");
    try {
      const result = await mutate<Idea>(`/ideas/${idea.id}`, { action, prompt });
      if (result.taskId && action === "accept") open({ type: "task", taskId: result.taskId });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View idea: ${idea.title}`}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: "row", gap: 14 }}
      >
        <Text style={{ fontSize: 27, width: 34, paddingTop: 3 }}>
          {/document|permission|form/i.test(idea.title)
            ? "📋"
            : /money|spend|saving/i.test(idea.title)
              ? "💸"
              : /goal|plan|training/i.test(idea.title)
                ? "👟"
                : /dinner|table/i.test(idea.title)
                  ? "🍽️"
                  : "💡"}
        </Text>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[s.heading, { fontSize: 16, lineHeight: 23 }]}>{idea.title}</Text>
          <Text style={s.muted}>{idea.reason}</Text>
        </View>
      </Pressable>
      {expanded && (
        <View style={{ gap: 15, marginTop: 18, paddingLeft: 48 }}>
          <EvidenceList items={idea.evidence} />
          {editing && (
            <Field
              label="What should OpenMuse do?"
              value={prompt}
              onChangeText={setPrompt}
              multiline
            />
          )}
          <ErrorNotice error={error} />
          <View style={[s.row, { gap: 8, flexWrap: "wrap" }]}>
            <Button
              primary
              busy={busy}
              disabled={!prompt.trim()}
              onPress={() => void act("accept")}
            >
              Start this
            </Button>
            <Button disabled={busy} onPress={() => setEditing(!editing)}>
              {editing ? "Keep edits" : "Edit"}
            </Button>
            <Button disabled={busy} onPress={() => void act("dismiss")}>
              Dismiss
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

export function IdeasScreen() {
  const { data, mutate } = useAgentWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refreshIdeas() {
    setBusy(true);
    setError("");
    try {
      await mutate("/ideas/refresh", {});
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  const ideas = data?.ideas.filter((idea) => idea.status === "new") || [];

  return (
    <View style={{ gap: 20 }}>
      <AgentStatus />
      <View style={s.between}>
        <Text style={s.small}>Inspired by your connected apps</Text>
        <Button small icon={RefreshCw} busy={busy} onPress={() => void refreshIdeas()}>
          Find ideas
        </Button>
      </View>
      <ErrorNotice error={error} />
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
      {!ideas.length && (
        <Empty
          icon={Lightbulb}
          title="Room for a good idea"
          detail="Find ideas from the sources you have granted access to. Each suggestion includes its evidence."
        />
      )}
      {(data?.ideas || [])
        .filter((idea) => idea.status === "accepted")
        .map((idea) => (
          <Card key={idea.id} style={{ gap: 7 }}>
            <Text style={s.heading}>{idea.title}</Text>
            <Chip tint={colors.green}>Started</Chip>
            {!!idea.taskId && <TaskLink taskId={idea.taskId} />}
          </Card>
        ))}
    </View>
  );
}
