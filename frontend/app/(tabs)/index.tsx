// app/(tabs)/index.tsx
// Home tab: compact "My Profile" summary + weekly schedule.
// - Add Event modal with overlap protection + inline error text.
// - Dummy CURRENT_USER + dummy events for now.
//
// BACKEND TODO:
// - Replace CURRENT_USER with real user data from auth/user endpoint.
// - Replace local events state with user-specific schedule from API.

import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Platform,
  Alert,
  Pressable,
} from "react-native";

const MAROON = "#A2172C";
const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUBTEXT = "#7A6F6F";
const INPUT_BG = "#F5EAEA";

const { width: W, height: H } = Dimensions.get("window");

// full-day grid
const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 56;
const COL_W = Math.min(280, Math.max(220, W * 0.78));

// Dummy current user (frontend-only)
// BACKEND TODO: hydrate from logged-in user.
const CURRENT_USER = {
  firstName: "Charlotte",
  lastName: "Chan",
  email: "charlotte.chan@example.edu",
  major: "Computer Science",
  yearOfStudy: "3", // or "Masters", "PhD"
  gender: "Female",
};

type EventItem = {
  id: string;
  title: string;
  color: string;
  startMins: number;
  endMins: number;
  recurrence: "once" | "weekly";
  dayIdx?: number; // 0-6 Mon-Sun for weekly
  date?: string; // "YYYY-MM-DD" for once
};

const pad2 = (n: number) => n.toString().padStart(2, "0");
const minsToLabel = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${pad2(mm)} ${ampm}`;
};
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const today = new Date();
const weekStart = (() => {
  const d = new Date(today);
  const day = (d.getDay() + 6) % 7; // Monday=0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
})();
const makeDay = (offset: number) => {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + offset);
  return d;
};
const iso = (d: Date) => d.toISOString().slice(0, 10);
const dowLabel = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: "short" });

const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

export default function ScheduleScreen() {
  const [events, setEvents] = useState<EventItem[]>([
    // Dummy weekly events
    {
      id: "e1",
      title: "Math Class",
      color: "#CFE2FF",
      startMins: 9 * 60,
      endMins: 10 * 60,
      recurrence: "weekly",
      dayIdx: 0, // Mon
    },
    {
      id: "e2",
      title: "Study Group",
      color: "#B2F2E8",
      startMins: 14 * 60,
      endMins: 15 * 60,
      recurrence: "weekly",
      dayIdx: 2, // Wed
    },
    // Dummy one-time event
    {
      id: "e3",
      title: "Art Workshop (One-time)",
      color: "#FFD6A5",
      startMins: 16 * 60,
      endMins: 17 * 60,
      recurrence: "once",
      date: iso(makeDay(4)), // Fri
    },
  ]);

  // Add-event modal state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"once" | "weekly">("weekly");
  const [dayIdx, setDayIdx] = useState<number>((today.getDay() + 6) % 7);
  const [date, setDate] = useState(iso(today));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [color, setColor] = useState("#CFE2FF");
  const [error, setError] = useState<string | null>(null);

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

  const parseHM = (hhmm: string) => {
    const [hRaw, mRaw] = hhmm.split(":");
    const h = parseInt(hRaw || "0", 10);
    const m = parseInt(mRaw || "0", 10);
    return clamp((isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m), 0, 24 * 60);
  };

  const hasOverlap = (candidate: EventItem) => {
    const { startMins, endMins } = candidate;

    const sameBucket = events.filter((e) => {
      if (e.recurrence !== candidate.recurrence) return false;
      if (e.recurrence === "weekly") {
        return e.dayIdx === candidate.dayIdx;
      }
      return e.date === candidate.date;
    });

    // overlap if they intersect in time
    return sameBucket.some(
      (e) => startMins < e.endMins && e.startMins < endMins
    );
  };

  const resetModal = () => {
    setTitle("");
    setType("weekly");
    setDayIdx((today.getDay() + 6) % 7);
    setDate(iso(today));
    setStart("09:00");
    setEnd("10:00");
    setColor("#CFE2FF");
    setError(null);
  };

  const addEvent = () => {
    setError(null);

    const startMins = parseHM(start);
    const endMinsRaw = parseHM(end);
    const safeEnd = Math.max(endMinsRaw, startMins + 15);

    if (safeEnd <= startMins) {
      setError(
        "End time must be after start time (minimum 15 minutes difference)."
      );
      return;
    }

    const base: EventItem = {
      id: `${Date.now()}`,
      title: title.trim() || "Untitled",
      color,
      startMins,
      endMins: safeEnd,
      recurrence: type,
    };

    const candidate: EventItem =
      type === "weekly"
        ? { ...base, dayIdx }
        : { ...base, date: (date || iso(today)).trim() };

    if (hasOverlap(candidate)) {
      setError(
        "You already have an event in this time range for that day. Please choose another slot."
      );
      return;
    }

    setEvents((prev) => [...prev, candidate]);
    resetModal();
    setOpen(false);
  };

  const confirmDelete = (e: EventItem) => {
    if (Platform.OS === "web") {
      const ok = window.confirm(`Delete "${e.title}" from your schedule?`);
      if (ok) setEvents((prev) => prev.filter((x) => x.id !== e.id));
      return;
    }

    Alert.alert(
      "Delete event?",
      `"${e.title}" will be removed from your schedule.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            setEvents((prev) => prev.filter((x) => x.id !== e.id)),
        },
      ]
    );
  };

  const eventsForDate = (d: Date) => {
    const idx = (d.getDay() + 6) % 7;
    const dayIso = iso(d);
    return events.filter((e) =>
      e.recurrence === "weekly" ? e.dayIdx === idx : e.date === dayIso
    );
  };

  const initials =
    (CURRENT_USER.firstName?.[0] || "") +
    (CURRENT_USER.lastName?.[0] || "");

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Schedule</Text>
      </View>

      {/* Compact Profile Summary */}
      <View style={styles.userCardWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {initials || "U"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>
            {CURRENT_USER.firstName} {CURRENT_USER.lastName}
          </Text>
          <Text style={styles.userMeta}>
            {CURRENT_USER.major}
            {CURRENT_USER.yearOfStudy
              ? ` • Year ${CURRENT_USER.yearOfStudy}`
              : ""}
          </Text>
          <Text style={styles.userEmail}>
            {CURRENT_USER.email}
          </Text>
        </View>
      </View>

      {/* Schedule */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 96 }}
        style={{ flex: 1, alignSelf: "stretch" }}
      >
        {days.map((d, i) => {
          const dayEvents = eventsForDate(d);
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
                  {timeRows.map((h, idx) => (
                    <View
                      key={h}
                      style={[
                        styles.hourRow,
                        {
                          top: idx * HOUR_HEIGHT,
                          height: HOUR_HEIGHT,
                        },
                        idx % 2 === 0 && styles.hourAlt,
                      ]}
                    >
                      <Text style={styles.hourLabel}>
                        {((h + 11) % 12) + 1}{" "}
                        {h >= 12 ? "PM" : "AM"}
                      </Text>
                    </View>
                  ))}

                  {dayEvents.map((e) => {
                    const top =
                      ((e.startMins / 60) - START_HOUR) *
                      HOUR_HEIGHT;
                    const height =
                      ((e.endMins - e.startMins) / 60) *
                      HOUR_HEIGHT;
                    return (
                      <Pressable
                        key={e.id}
                        onLongPress={() => confirmDelete(e)}
                        onPress={() => {
                          if (Platform.OS === "web")
                            confirmDelete(e);
                        }}
                        android_ripple={{
                          color: "rgba(0,0,0,0.05)",
                        }}
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
                        <Text
                          style={styles.eventTitle}
                          numberOfLines={2}
                        >
                          {e.title}
                        </Text>
                        <Text style={styles.eventTime}>
                          {minsToLabel(e.startMins)} —{" "}
                          {minsToLabel(e.endMins)}
                        </Text>
                        {Platform.OS !== "web" && (
                          <Text style={styles.hint}>
                            Long-press to delete
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => {
          resetModal();
          setOpen(true);
        }}
      >
        <Text style={styles.fabPlus}>＋</Text>
        <Text style={styles.fabText}>Add</Text>
      </TouchableOpacity>

      {/* Add Event Modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setOpen(false);
          setError(null);
        }}
      >
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Event</Text>

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Title"
              placeholderTextColor={SUBTEXT}
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (error) setError(null);
              }}
            />

            <View style={styles.segmentWrap}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  type === "weekly" &&
                    styles.segmentActive,
                ]}
                onPress={() => {
                  setType("weekly");
                  if (error) setError(null);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === "weekly" &&
                      styles.segmentTextActive,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  type === "once" &&
                    styles.segmentActive,
                ]}
                onPress={() => {
                  setType("once");
                  if (error) setError(null);
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === "once" &&
                      styles.segmentTextActive,
                  ]}
                >
                  One-time
                </Text>
              </TouchableOpacity>
            </View>

            {type === "weekly" ? (
              <>
                <Text style={styles.label}>Day of week</Text>
                <View style={styles.weekRow}>
                  {[
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                  ].map((d, idx) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.dayPill,
                        dayIdx === idx &&
                          styles.dayPillActive,
                      ]}
                      onPress={() => {
                        setDayIdx(idx);
                        if (error) setError(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          dayIdx === idx &&
                            styles.dayPillTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>
                  Date (YYYY-MM-DD)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={iso(today)}
                  placeholderTextColor={SUBTEXT}
                  value={date}
                  onChangeText={(t) => {
                    setDate(t);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                />
              </>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  Start (HH:MM)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  placeholderTextColor={SUBTEXT}
                  value={start}
                  onChangeText={(t) => {
                    setStart(t);
                    if (error) setError(null);
                  }}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>
                  End (HH:MM)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor={SUBTEXT}
                  value={end}
                  onChangeText={(t) => {
                    setEnd(t);
                    if (error) setError(null);
                  }}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorRow}>
              {[
                "#CFE2FF",
                "#B2F2E8",
                "#E5C6FF",
                "#FFD6A5",
                "#FFADAD",
              ].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setColor(c);
                    if (error) setError(null);
                  }}
                  style={[
                    styles.colorSwatch,
                    {
                      backgroundColor: c,
                      borderColor:
                        color === c
                          ? TEXT
                          : "transparent",
                    },
                  ]}
                />
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[
                  styles.btn,
                  { backgroundColor: "#E6E6E6" },
                ]}
                onPress={() => {
                  setOpen(false);
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.btnText,
                    { color: TEXT },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                style={styles.btn}
                onPress={addEvent}
              >
                <Text style={styles.btnText}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({
      ios: 8,
      android: 10,
      web: 18,
    }),
    paddingBottom: 4,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
  },

  // User card
  userCardWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F5EAEA",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: MAROON,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
  },
  userMeta: {
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: SUBTEXT,
    marginTop: 1,
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
    pointerEvents: "none",
  },
  hourAlt: { backgroundColor: "#FAFAFA" },
  hourLabel: { fontSize: 11, color: SUBTEXT },

  event: {
    position: "absolute",
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d1d1f",
  },
  eventTime: { fontSize: 11, color: "#3a3a3c" },
  hint: { fontSize: 10, color: "#444", marginTop: 2 },

  fab: {
    position: "absolute",
    right: 18,
    bottom: 24,
    backgroundColor: MAROON,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabPlus: { color: "#fff", fontSize: 20, marginRight: 6 },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 13,
    marginTop: 2,
    marginBottom: 4,
    textAlign: "center",
  },

  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 16,
  },
  label: {
    fontSize: 12,
    color: SUBTEXT,
    marginTop: 6,
    marginBottom: 4,
  },

  segmentWrap: {
    flexDirection: "row",
    backgroundColor: "#EFEFEF",
    borderRadius: 999,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
  },
  segmentActive: { backgroundColor: MAROON },
  segmentText: { fontSize: 13, color: TEXT, fontWeight: "700" },
  segmentTextActive: { color: "#fff" },

  weekRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#EFEFEF",
  },
  dayPillActive: { backgroundColor: MAROON },
  dayPillText: { color: TEXT, fontWeight: "700", fontSize: 12 },
  dayPillTextActive: { color: "#fff" },

  row: { flexDirection: "row" },

  colorRow: { flexDirection: "row", gap: 10 },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
  },

  modalBtns: {
    flexDirection: "row",
    marginTop: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: MAROON,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
