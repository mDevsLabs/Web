import {
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  Globe2,
  Inbox,
  Link2,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type {
  CalendarEvent,
} from "../../../../packages/domain/src";
import { localDateTime } from "../date-time";
import {
  Button,
  Card,
  Chip,
  colors,
  dateLabel,
  Empty,
  ErrorNotice,
  IconButton,
  LinkRow,
  Mascot,
  relativeDate,
  resultSummary,
  SectionHeading,
  Sheet,
  s,
  timeLabel,
} from "../ui";
import { useWorkspace } from "../workspace";

function todayDate() {
  return localDateTime(new Date().toISOString(), Intl.DateTimeFormat().resolvedOptions().timeZone)
    .date;
}

function eventDate(event: CalendarEvent) {
  return event.allDay ? event.start : localDateTime(event.start, event.timeZone).date;
}

function Avatar({ name }: { name: string }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.blueSoft,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: "600", color: colors.blueDark }}>
        {name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")}
      </Text>
    </View>
  );
}

export function AgendaRow({
  event: e,
  index = 0,
  neighbors,
}: {
  event: CalendarEvent;
  index?: number;
  neighbors?: CalendarEvent[];
}) {
  const { open } = useWorkspace();
  return (
    <Pressable
      onPress={() => open({ type: "event", event: e, neighbors })}
      style={[s.row, { gap: 16, paddingVertical: 14 }]}
    >
      <View style={{ width: 65 }}>
        <Text style={[s.text, { fontSize: 11 }]}>
          {e.allDay ? "All day" : timeLabel(e.start, e.timeZone)}
        </Text>
        {!e.allDay && (
          <Text style={[s.small, { fontSize: 10 }]}>{timeLabel(e.end, e.timeZone)}</Text>
        )}
      </View>
      <View
        style={{
          width: 3,
          height: 42,
          borderRadius: 4,
          backgroundColor: ["#BCDAEB", "#C7D6AB", "#D9CDEA"][index % 3],
        }}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[s.text, { fontSize: 13, fontWeight: "500" }]}>{e.title}</Text>
        <Text numberOfLines={1} style={[s.small, { fontSize: 11 }]}>
          {e.location || (e.attendees.length ? `${e.attendees.length} attendees` : "Time for you")}
        </Text>
      </View>
      <ChevronRight size={14} color={colors.muted} />
    </Pressable>
  );
}

export function TodayScreen() {
  const { workspace: w, navigate, open, ask } = useWorkspace();
  const wide = useWindowDimensions().width > 1180;
  const pending = w.actions.filter((a) => a.status === "awaiting_review");
  const unread = w.mail.filter((m) => m.unread);
  const today = todayDate();
  const events = w.events
    .filter((e) => eventDate(e) === today)
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <View style={{ gap: 25 }}>
      <View
        style={[
          {
            backgroundColor: "#E8F2F8",
            borderRadius: 24,
            padding: 32,
            minHeight: 228,
            overflow: "hidden",
          },
          s.row,
        ]}
      >
        <View style={{ flex: 1, gap: 15, zIndex: 1 }}>
          <View style={[s.row, { gap: 7 }]}>
            <Sparkles size={13} color={colors.blueDark} />
            <Text style={[s.label, { color: colors.blueDark }]}>A little clarity, every day</Text>
          </View>
          <Text
            style={{
              fontSize: wide ? 39 : 29,
              lineHeight: wide ? 45 : 36,
              letterSpacing: -1.7,
              fontWeight: "500",
              color: colors.text,
            }}
          >
            Your day, with a little{"\n"}more room to breathe.
          </Text>
          <Text style={[s.muted, { maxWidth: 420, color: "#617680" }]}>
            {events.length ? `${events.length} things on your calendar` : "Your calendar has room"}
            {unread.length ? `, ${unread.length} unread emails` : ""}.{"\n"}Let's make space for
            what matters.
          </Text>
          <Button
            onPress={() => ask("Help me plan my day")}
            icon={Sparkles}
            primary
            style={{ alignSelf: "flex-start", marginTop: 5 }}
          >
            Plan my day
          </Button>
        </View>
        {wide && (
          <View style={{ width: 220, height: 210, alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                position: "absolute",
                width: 190,
                height: 190,
                borderRadius: 100,
                backgroundColor: "#DAEAF2",
              }}
            />
            <View
              style={{
                position: "absolute",
                width: 145,
                height: 145,
                borderRadius: 80,
                borderWidth: 1,
                borderColor: "#C8DBE6",
              }}
            />
            <Mascot size={94} />
            <View
              style={[
                s.row,
                {
                  position: "absolute",
                  top: 17,
                  left: -19,
                  padding: 11,
                  gap: 7,
                  backgroundColor: "#FFF",
                  borderRadius: 13,
                  transform: [{ rotate: "-7deg" }],
                },
              ]}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: colors.green,
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: "500", color: colors.text }}>
                Here with you
              </Text>
            </View>
          </View>
        )}
      </View>

      {pending.length > 0 && (
        <View style={{ gap: 11 }}>
          <SectionHeading action={{ label: "View all", onPress: () => navigate("activity") }}>
            Waiting on your review ({pending.length})
          </SectionHeading>
          <View style={{ gap: 9 }}>
            {pending.slice(0, 3).map((a) => (
              <Card key={a.id} onPress={() => open({ type: "action", action: a })} style={{ gap: 9 }}>
                <View style={[s.row, { justifyContent: "space-between" }]}>
                  <Chip color={colors.gold}>{a.risk} risk</Chip>
                  <Text style={s.small}>{relativeDate(a.createdAt)}</Text>
                </View>
                <Text style={s.h2}>{a.title}</Text>
                <Text numberOfLines={2} style={s.muted}>
                  {a.description}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      )}

      <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
        <View style={{ flex: 1, gap: 12 }}>
          <SectionHeading
            action={{ label: "Open calendar", onPress: () => navigate("calendar") }}
          >
            Today's schedule
          </SectionHeading>
          <Card style={{ paddingVertical: 4 }}>
            {events.length === 0 ? (
              <Empty
                icon={CalendarDays}
                title="A quiet day"
                description="No events on your calendar today. Enjoy the focus time."
              />
            ) : (
              events.map((e, index) => (
                <AgendaRow key={e.id} event={e} index={index} neighbors={events} />
              ))
            )}
          </Card>
        </View>

        <View style={{ flex: 1, gap: 12 }}>
          <SectionHeading action={{ label: "Open inbox", onPress: () => navigate("mail") }}>
            Unread mail ({unread.length})
          </SectionHeading>
          <Card style={{ paddingVertical: 4 }}>
            {unread.length === 0 ? (
              <Empty
                icon={Inbox}
                title="Inbox clear"
                description="No unread messages. You're all caught up."
              />
            ) : (
              unread.slice(0, 5).map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => open({ type: "thread", thread: m })}
                  style={[s.row, { gap: 12, paddingVertical: 12 }]}
                >
                  <Avatar name={m.from.name} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={[s.row, { justifyContent: "space-between" }]}>
                      <Text style={[s.text, { fontSize: 12, fontWeight: "600" }]}>
                        {m.from.name}
                      </Text>
                      <Text style={[s.small, { fontSize: 10 }]}>{relativeDate(m.date)}</Text>
                    </View>
                    <Text numberOfLines={1} style={[s.text, { fontSize: 12 }]}>
                      {m.subject}
                    </Text>
                    <Text numberOfLines={1} style={[s.muted, { fontSize: 11 }]}>
                      {m.snippet}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </Card>
        </View>
      </View>
    </View>
  );
}
