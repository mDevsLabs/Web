import { useRef, useState } from "react";
import { Text, View } from "react-native";
import type { AgentTask } from "../../../../packages/domain/src/agent";
import { useAgentWorkspace } from "../agent-workspace";
import { Button, CheckRow, ErrorNotice, Field, s, Sheet } from "../ui";
import { useWorkspace } from "../workspace";
import { errorText, statusLabel } from "./task-common";

export function DelegateSheet({ goalId, milestoneId }: { goalId?: string; milestoneId?: string }) {
  const { workspace, close, open } = useWorkspace();
  const { data, delegate } = useAgentWorkspace();
  const goal = data?.goals.find((item) => item.id === goalId);
  const milestone = goal?.milestones.find((item) => item.id === milestoneId);
  const submission = useRef<{ input: string; id: string } | null>(null);
  const submitting = useRef(false);
  const [kind, setKind] = useState<AgentTask["kind"]>("plan");
  const [title] = useState(milestone?.title);
  const [prompt, setPrompt] = useState(
    milestone && goal
      ? `Help with this milestone: ${milestone.title}\nGoal: ${goal.title}\n${goal.description}`
      : "",
  );
  const [messageId, setMessageId] = useState("");
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const input = {
        title,
        prompt: prompt.trim(),
        kind,
        goalId,
        milestoneId,
        input: kind === "finance" ? { csv } : kind === "document" ? { messageId } : {},
      };
      const serialized = JSON.stringify(input);
      if (submission.current?.input !== serialized)
        submission.current = {
          input: serialized,
          id: `delegate-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };
      const task = await delegate(input, submission.current.id);
      open({ type: "task", taskId: task.id });
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Sheet
      title="Hand over an outcome"
      subtitle="OpenMuse saves a plan and keeps working on the server."
      onClose={close}
    >
      {milestoneId && (
        <Text style={[s.muted, { marginBottom: 16 }]}>
          {milestone
            ? `${goal?.title} · ${milestone.title}. Mark this milestone complete when you are satisfied with the result.`
            : "This milestone is no longer available."}
        </Text>
      )}
      <View style={[s.row, { flexWrap: "wrap", gap: 8, marginBottom: 20 }]}>
        {(["plan", "document", "finance", "agent"] as const).map((item) => (
          <Button small primary={kind === item} key={item} onPress={() => setKind(item)}>
            {item === "agent" ? "General task" : statusLabel(item)}
          </Button>
        ))}
      </View>
      <Field
        label="What would you like done?"
        value={prompt}
        onChangeText={setPrompt}
        multiline
        placeholder={
          kind === "document"
            ? "Fill the attached form and prepare a reply for my review"
            : kind === "finance"
              ? "Summarize my spending and suggest a savings plan"
              : "Make a practical plan for my week"
        }
      />
      {kind === "document" && (
        <View style={{ gap: 8, marginBottom: 18 }}>
          <Text style={s.heading}>Choose the email with the PDF</Text>
          {workspace.mail
            .filter((mail) => mail.attachments.length)
            .map((mail) => (
              <CheckRow
                key={mail.id}
                checked={mail.id === messageId}
                label={`${mail.subject} · ${mail.sender}`}
                onPress={() => setMessageId(mail.id)}
              />
            ))}
          {!workspace.mail.some((mail) => mail.attachments.length) && (
            <Text style={s.muted}>
              Connect mail in Apps and select a message with a PDF attachment.
            </Text>
          )}
        </View>
      )}
      {kind === "finance" && (
        <>
          <Field
            label="Transaction CSV"
            value={csv}
            onChangeText={setCsv}
            multiline
            autoCapitalize="none"
            placeholder={"date,description,amount,category\n2026-09-01,Groceries,54.20,Food"}
          />
          {workspace.mode === "sample" && (
            <Button
              onPress={() =>
                setCsv(
                  "date,description,amount,category\n2026-09-01,Salary,-4200,Income\n2026-09-02,Groceries,84.50,Food\n2026-09-03,Subscription,19.99,Subscriptions\n2026-09-04,Coffee,6.50,Food",
                )
              }
            >
              Try example transactions
            </Button>
          )}
          <Text style={[s.small, { marginVertical: 12 }]}>
            Positive amounts are expenses; negative amounts are income. Imported data only. No bank
            connection is implied.
          </Text>
        </>
      )}
      {kind === "agent" && !workspace.runtime.configured && (
        <Text style={[s.muted, { marginBottom: 16 }]}>
          General tasks and plans require a configured model. Document jobs, page watches and
          spending summaries have guided workflows.
        </Text>
      )}
      <ErrorNotice error={error} />
      <Button
        primary
        busy={busy}
        disabled={
          Boolean(milestoneId && !milestone) ||
          !prompt.trim() ||
          (kind === "document" && !messageId) ||
          (kind === "finance" && !csv.trim())
        }
        onPress={() => void submit()}
      >
        Delegate task
      </Button>
    </Sheet>
  );
}
