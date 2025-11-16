// app/user/[id]/schedule.tsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";

const { width: W, height: H } = Dimensions.get("window");
const COL_W = Math.min(280, Math.max(200, W * 0.78));
const HOUR_HEIGHT = 56;
const START_HOUR = 7;
const END_HOUR = 20;

// --- TEMP MOCK (keep in sync with user/[id].tsx) ---
// Backend later: GET /people/:id and GET /people/:id/schedule
const PEOPLE: Record<string, any> = {
  charlotte: {
    id: "charlotte",
    name: "Charlotte Chan",
    events: [
      {
        title: "Physics Lecture",
        color: "#B2F2E8",
        start: 9 * 60,
        end: 10 * 60,
        dayIdx: 0,
      },
      {
        title: "Math Class",
        color: "#E5C6FF",
        start: 14 * 60,
        end: 15 * 60,
        dayIdx: 0,
      },
      {
        title: "Group Study",
        color: "#B2F2E8",
        start: 10 * 60,
        end: 11 * 60,
        dayIdx: 2,
      },
      {
        title: "Art Workshop",
        color: "#CFE2FF",
        start: 18 * 60,
        end: 19 * 60,
        dayIdx: 4,
      },
    ],
  },
  sam: {
    id: "sam",
    name: "Sam Patel",
    events: [
      {
        title: "Quantum Seminar",
        color: "#CFE2FF",
        start: 11 * 60,
        end: 12 * 60,
        dayIdx: 2,
      },
    ],
  },
  muller: {
    id: "muller",
    name: "Lena Muller",
    events: [
      {
        title: "Chem Lab",
        color: "#FFD6A5",
        start: 16 * 60,
        end: 17 * 60,
        dayIdx: 1,
      },
    ],
  },
};
// ---------------------------------------------------

const minsToLabel = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
};

const weekStartMonday = () => {
  const t = new Date();
  const d = (t.getDay() + 6) % 7; // Mon=0
  t.setDate(t.getDate() - d);
  t.setHours(0, 0, 0, 0);
  return t;
};
const makeDay = (i: number) => {
  const d = new Date(weekStartMonday());
  d.setDate(d.getDate() + i);
  return d;
};
const dowLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "short" });

export default function ReadonlySchedule() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const person = PEOPLE[id || "charlotte"] || PEOPLE.charlotte;

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => makeDay(i)),
    []
  );
  const timeRows = useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR + 1 },
        (_, i) => START_HOUR + i
      ),
    []
  );

  const eventsForDayIdx = (idx: number) =>
    (person.events || []).filter((e: any) => e.dayIdx === idx);
  const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Simple header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Text style={{ color: MAROON, fontWeight: "800" }}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{person.name} — Schedule</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Weekly schedule (read-only) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 96 }}
        style={{ flex: 1, alignSelf: "stretch" }}
      >
        {days.map((d, i) => {
          const idx = (d.getDay() + 6) % 7; // Mon=0
          const dayEvents = eventsForDayIdx(idx);
          return (
            <View key={i} style={[styles.col, { width: COL_W }]}>
              <View style={styles.colHeader}>
                <Text style={styles.dow}>{dowLabel(d)}</Text>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{d.getDate()}</Text>
                </View>
              </View>

              <ScrollView
                style={{ height: Math.max(H * 0.65, 420) }}
                contentContainerStyle={{ height: GRID_HEIGHT }}
                showsVerticalScrollIndicator
              >
                <View style={{ position: "relative", height: GRID_HEIGHT }}>
                  {timeRows.map((h, idx2) => (
                    <View
                      key={h}
                      style={[
                        styles.hourRow,
                        { top: idx2 * HOUR_HEIGHT, height: HOUR_HEIGHT },
                        idx2 % 2 === 0 && styles.hourAlt,
                      ]}
                    >
                      <Text style={styles.hourLabel}>
                        {((h + 11) % 12) + 1} {h >= 12 ? "PM" : "AM"}
                      </Text>
                    </View>
                  ))}

                  {dayEvents.map((e: any, k: number) => {
                    const top = (e.start / 60 - START_HOUR) * HOUR_HEIGHT;
                    const height = ((e.end - e.start) / 60) * HOUR_HEIGHT;
                    return (
                      <View
                        key={k}
                        style={[
                          styles.event,
                          {
                            top,
                            height,
                            backgroundColor: e.color,
                            width: COL_W - 24,
                            left: 12,
                          },
                        ]}
                      >
                        <Text style={styles.eventTitle} numberOfLines={2}>
                          {e.title}
                        </Text>
                        <Text style={styles.eventTime}>
                          {minsToLabel(e.start)} — {minsToLabel(e.end)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.actionsWrap}>
        <TouchableOpacity
          style={[styles.actBtn, { backgroundColor: MAROON }]}
          activeOpacity={0.9}
          onPress={() =>
            router.push({ pathname: "/messages/[id]", params: { id } })
          }
        >
          <Text style={styles.actText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actBtn, { backgroundColor: MAROON }]}
          activeOpacity={0.9}
          onPress={() => {}}
        >
          <Text style={styles.actText}>Invite to Study Session</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 4, android: 8, web: 12 }),
    paddingBottom: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },

  col: {
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  colHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEE",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dow: { fontSize: 14, fontWeight: "700", color: TEXT },
  dateBadge: {
    backgroundColor: "#F1F5FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: { fontSize: 12, fontWeight: "700", color: MAROON },

  hourRow: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E8E8E8",
    paddingLeft: 8,
    justifyContent: "center",
    // @ts-ignore RN Web only
    pointerEvents: "none",
  },
  hourAlt: { backgroundColor: "#FAFAFA" },
  hourLabel: { fontSize: 11, color: SUB },

  event: { position: "absolute", borderRadius: 10, padding: 8, gap: 4 },
  eventTitle: { fontSize: 13, fontWeight: "700", color: "#1d1d1f" },
  eventTime: { fontSize: 11, color: "#3a3a3c" },

  actionsWrap: {
    paddingHorizontal: 16,
    paddingBottom: Platform.select({ ios: 20, android: 16, web: 16 }),
    gap: 12,
  },
  actBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  actText: { color: "#fff", fontWeight: "700" },
});
