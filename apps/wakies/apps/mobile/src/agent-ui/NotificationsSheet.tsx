import { Bell } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { useAgentWorkspace } from "../agent-workspace";
import { Button, Card, Chip, colors, Empty, ErrorNotice, s, Sheet } from "../ui";
import { useWorkspace } from "../workspace";
import { errorText, stamp } from "./task-common";

export function NotificationsSheet() {
  const { data, mutate } = useAgentWorkspace();
  const { close, open } = useWorkspace();
  const [error, setError] = useState("");

  async function read(id: string, taskId?: string) {
    try {
      await mutate(`/notifications/${id}/read`, {});
      if (taskId) open({ type: "task", taskId });
    } catch (e) {
      setError(errorText(e));
    }
  }

  return (
    <Sheet
      title="Notifications"
      subtitle="Results and decisions that need your attention."
      onClose={close}
    >
      <View style={{ gap: 14 }}>
        <ErrorNotice error={error} />
        {data?.notifications.map((item) => (
          <Card
            key={item.id}
            style={{ gap: 8, backgroundColor: item.read ? colors.card : colors.sky }}
          >
            <View style={s.between}>
              <Text style={s.heading}>{item.title}</Text>
              {!item.read && <Chip>New</Chip>}
            </View>
            <Text style={s.muted}>{item.body}</Text>
            <Text style={s.small}>{stamp(item.createdAt)}</Text>
            <Button small onPress={() => void read(item.id, item.taskId)}>
              {item.taskId ? "View task" : item.read ? "Read" : "Mark read"}
            </Button>
          </Card>
        ))}
        {!data?.notifications.length && (
          <Empty
            icon={Bell}
            title="You're all caught up"
            detail="Results, meaningful changes and requests for your input will appear here."
          />
        )}
      </View>
    </Sheet>
  );
}
