// app/user/[id].tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getPerson,
  useStoreVersion,
  Person,
  isFollowing,
  toggleFollow,
  CURRENT_USER_ID,
} from "../lib/followStore";
import axios from "axios";
import { getItem as storageGetItem } from "../lib/storage";
import { API_BASE } from "../lib/config";
import { chat, ME_ID } from "../lib/chatStore";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";
const CARD = "#FFFFFF";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);

const START_HOUR = 7;
const END_HOUR = 20;
const ROW_H = 40;
// Weekday labels for the small profile preview. Show full week from Monday to Sunday.
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type EventItem = {
  title: string;
  color: string;
  startMins: number;
  endMins: number;
  dayIdx: number;
};

const DUMMY_EVENTS: Record<string, EventItem[]> = {
  charlotte: [
    {
      title: "Physics Lecture",
      color: "#CFE2FF",
      startMins: 9 * 60,
      endMins: 10 * 60,
      dayIdx: 0,
    },
    {
      title: "Group Study",
      color: "#B2F2E8",
      startMins: 11 * 60,
      endMins: 12 * 60,
      dayIdx: 0,
    },
    {
      title: "Free Slot",
      color: "#F4ECFF",
      startMins: 14 * 60,
      endMins: 15 * 60,
      dayIdx: 0,
    },
    {
      title: "Math Class",
      color: "#CFE2FF",
      startMins: 16 * 60,
      endMins: 17 * 60,
      dayIdx: 0,
    },
    {
      title: "Art Workshop",
      color: "#FFD6A5",
      startMins: 18 * 60,
      endMins: 19 * 60,
      dayIdx: 2,
    },
  ],
  "sam-patel": [
    {
      title: "Quantum Seminar",
      color: "#CFE2FF",
      startMins: 11 * 60,
      endMins: 12 * 60,
      dayIdx: 1,
    },
    {
      title: "Basketball Practice",
      color: "#FFADAD",
      startMins: 17 * 60,
      endMins: 18 * 60,
      dayIdx: 3,
    },
  ],
  "sam-hitchens": [
    {
      title: "History Reading Group",
      color: "#E5C6FF",
      startMins: 10 * 60,
      endMins: 11 * 60 + 30,
      dayIdx: 0,
    },
    {
      title: "Study Session",
      color: "#B2F2E8",
      startMins: 15 * 60,
      endMins: 16 * 60,
      dayIdx: 2,
    },
  ],
  muller: [
    {
      title: "Chemistry Lab",
      color: "#FFD6A5",
      startMins: 13 * 60,
      endMins: 15 * 60,
      dayIdx: 0,
    },
    {
      title: "Study Group",
      color: "#B2F2E8",
      startMins: 10 * 60,
      endMins: 11 * 60,
      dayIdx: 2,
    },
  ],
};

const minsToLabel = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  const mmStr = mm.toString().padStart(2, "0");
  return `${h12}:${mmStr} ${ampm}`;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useStoreVersion();

  // Allow fetching a remote person when the local in-memory store doesn't
  // contain the searched user. We prefer local store when available.
  const [remotePerson, setRemotePerson] = useState<Person | null>(null);
  const [remoteSchedule, setRemoteSchedule] = useState<EventItem[] | null>(
    null
  );

  const person: Person | null = useMemo(() => {
    if (remotePerson) return remotePerson;
    if (!id) return null;
    return getPerson(id) ?? null;
  }, [id, remotePerson]);

  // Fetch user from backend if not available locally.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return;
        // If a local person exists, skip remote fetch.
        const local = getPerson(id);
        if (local) return;

        const token = await storageGetItem("token");
        const res = await axios.get(`${API_BASE}/api/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          timeout: 10000,
        });

        const u = res?.data?.user;
        if (!u) return;

        const mapped: Person = {
          id: String(u._id || u.id || u.username),
          name:
            u.firstName ||
            u.username ||
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            "Student",
          major: u.major || "",
          bio: u.bio || "",
          avatar: u.profilePicture || null,
          followers: u.followers || 0,
          following: u.following || 0,
          scheduleVisible: !!u.schedule,
        };
        if (mounted) {
          setRemotePerson(mapped);
          // store schedule if present (map to local EventItem shape when necessary)
          if (Array.isArray(u.schedule) && u.schedule.length) {
            // Assume backend schedule items are already in the expected shape
            // (id, title, color, startMins, endMins, recurrence, dayIdx/date).
            setRemoteSchedule(u.schedule);
          }
        }
      } catch (e) {
        // ignore errors — UI already has graceful fallbacks
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const displayName = person?.name || "Student";
  // Prefer a fetched remote schedule when available. Fall back to demo events
  // (used for local in-memory people) so the preview shows something.
  const events: EventItem[] =
    remoteSchedule && remoteSchedule.length
      ? remoteSchedule
      : person
      ? DUMMY_EVENTS[person.id] || []
      : [];
  // Schedule visibility rules:
  // - If viewing your own profile, always show schedule.
  // - If the person has scheduleVisible=true, show to everyone.
  // - If scheduleVisible=false (private), only show to followers.
  const showSchedule = person
    ? person.id === CURRENT_USER_ID
      ? true
      : person.scheduleVisible
      ? true
      : isFollowing(person.id)
    : true;

  const isMe = person?.id === CURRENT_USER_ID;
  const following = person ? isFollowing(person.id) : false;
  const canFollow = !!person && !isMe;

  const [selected, setSelected] = useState<EventItem | null>(null);

  const eventsForDay = (dayIdx: number): EventItem[] =>
    events.filter((e) => e.dayIdx === dayIdx);

  const handleMessage = () => {
    if (!person) return;
    router.push(`/messages/${person.id}`);
  };

  // Invite flow: uses selected slot if present, otherwise generic.
  const handleInvite = async () => {
    if (!person) return;

    let body: string;
    const token = await storageGetItem("token");
    // Request the current authenticated user's profile so we can display
    // their real name as the sender. Previously this fetched the target
    // user's record (using `id`) which caused the sender name to show the
    // recipient's username instead of the sender's name.
    let senderName = "Another student";
    try {
      const res = await axios.get(`${API_BASE}/api/users/profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 10000,
      });
      const u = res?.data?.user;
      if (u) {
        const first = u.firstName || u.username || "";
        const last = u.lastName || "";
        senderName = `${first}${last ? ` ${last}` : ""}`.trim();
      }
    } catch (e) {
      // keep fallback senderName
    }

    if (selected) {
      const dayName = DAYS[selected.dayIdx];
      const start = minsToLabel(selected.startMins);
      const end = minsToLabel(selected.endMins);
      body =
        `Hi ${person.name}, my name is ${senderName}. ` +
        `I saw your schedule and would love to set up a study session ` +
        `on ${dayName} between ${start} and ${end}. ` +
        `Let me know if that works for you 🙂`;
    } else {
      body =
        `Hi ${person.name}, my name is ${senderName}. ` +
        `I'd like to invite you to a study session sometime soon. ` +
        `Let me know what works for you 🙂`;
    }

    chat.send(person.id, person.name, body);
    router.push(`/messages/${person.id}`);
  };

  const handleToggleFollow = () => {
    if (!person || isMe) return;
    toggleFollow(person.id); // BACKEND/TODO: follow/unfollow endpoint
  };

  const isSelected = (e: EventItem) =>
    selected &&
    selected.dayIdx === e.dayIdx &&
    selected.startMins === e.startMins &&
    selected.endMins === e.endMins &&
    selected.title === e.title;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ alignItems: "center", paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerRow, { width: WRAP_W }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Student Profile</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Profile info */}
        <View style={[styles.headerWrap, { width: WRAP_W }]}>
          {person?.avatar ? (
            <Image source={{ uri: person.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0)}</Text>
            </View>
          )}

          <Text style={styles.name}>{displayName}</Text>

          <Text style={styles.sub}>
            {person?.major ? `Major: ${person.major}` : "Major: —"}
            {person?.bio ? `\n${person.bio}` : ""}
          </Text>

          <Text style={styles.meta}>
            {person?.followers ?? 0} Followers {person?.following ?? 0}{" "}
            Following
          </Text>

          {canFollow && (
            <TouchableOpacity
              style={[styles.followBtn, following && styles.followBtnActive]}
              onPress={handleToggleFollow}
              activeOpacity={0.9}
            >
              <Text
                style={[
                  styles.followText,
                  following && styles.followTextActive,
                ]}
              >
                {following ? "Unfollow" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Schedule or hidden */}
        {showSchedule ? (
          <View style={[styles.previewCard, { width: WRAP_W }]}>
            <Text style={styles.scheduleSubtitle}>{`${DAYS[0]} - ${
              DAYS[DAYS.length - 1]
            }`}</Text>
            <View style={styles.daysHeader}>
              {DAYS.map((d) => (
                <Text key={d} style={styles.dayLabel}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: "row" }}>
              {DAYS.map((_, dayIdx) => (
                <View key={dayIdx} style={styles.col}>
                  <View
                    style={{
                      position: "relative",
                      height: (END_HOUR - START_HOUR) * ROW_H,
                    }}
                  >
                    {Array.from(
                      { length: END_HOUR - START_HOUR + 1 },
                      (_, i) => START_HOUR + i
                    ).map((h, idx) => (
                      <View
                        key={h}
                        style={[styles.row, idx % 2 === 0 && styles.altRow]}
                      >
                        {dayIdx === 0 && (
                          <Text style={styles.timeLabel}>
                            {h <= 12 ? `${h} AM` : `${h - 12} PM`}
                          </Text>
                        )}
                      </View>
                    ))}

                    {eventsForDay(dayIdx).map((e, i) => {
                      const top = (e.startMins / 60 - START_HOUR) * ROW_H;
                      const height = ((e.endMins - e.startMins) / 60) * ROW_H;
                      const selectedStyle = isSelected(e)
                        ? styles.eventBlockSelected
                        : null;

                      return (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.8}
                          onPress={() => setSelected(isSelected(e) ? null : e)}
                          style={[
                            styles.eventBlock,
                            {
                              top,
                              height,
                              backgroundColor: e.color,
                              // Slight transparency so preview blocks are softer visually
                              opacity: isSelected(e) ? 1 : 0.92,
                            },
                            selectedStyle,
                          ]}
                        >
                          <Text style={styles.eventTitle} numberOfLines={2}>
                            {e.title}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>

            {selected && (
              <Text style={styles.selectedHint}>
                Selected slot: {DAYS[selected.dayIdx]}{" "}
                {minsToLabel(selected.startMins)} –{" "}
                {minsToLabel(selected.endMins)}
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.previewCard, { width: WRAP_W }]}>
            <Text style={styles.hiddenTitle}>Schedule hidden</Text>
            <Text style={styles.hiddenText}>
              This student has chosen not to display their schedule.
            </Text>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={[styles.primaryBtn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={handleMessage}
        >
          <Text style={styles.primaryBtnText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ghostBtn, { width: WRAP_W }]}
          activeOpacity={0.9}
          onPress={handleInvite}
        >
          <Text style={styles.ghostBtnText}>Invite to study session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.select({ ios: 8, android: 8, web: 24 }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  pageTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
  },
  headerWrap: {
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginTop: 4,
    backgroundColor: "#eee",
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: "800",
    color: MAROON,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    marginTop: 4,
  },
  sub: {
    color: SUB,
    textAlign: "center",
    marginTop: 4,
  },
  meta: {
    color: SUB,
    marginTop: 4,
  },
  followBtn: {
    marginTop: 8,
    paddingHorizontal: 26,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: MAROON,
    backgroundColor: "#fff",
  },
  followBtnActive: {
    backgroundColor: MAROON,
  },
  followText: {
    fontSize: 14,
    fontWeight: "700",
    color: MAROON,
  },
  followTextActive: {
    color: "#fff",
  },
  previewCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: TEXT,
  },
  col: {
    flex: 1,
    marginHorizontal: 1,
  },
  row: {
    height: ROW_H,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
    justifyContent: "flex-start",
    paddingLeft: 2,
  },
  altRow: {
    backgroundColor: "#FAFAFA",
  },
  timeLabel: {
    fontSize: 8,
    color: SUB,
  },
  eventBlock: {
    position: "absolute",
    left: 3,
    right: 3,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  eventTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#1d1d1f",
  },
  hiddenTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 4,
  },
  hiddenText: {
    fontSize: 13,
    color: SUB,
  },
  scheduleSubtitle: {
    textAlign: "center",
    color: SUB,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  selectedHint: {
    marginTop: 8,
    color: SUB,
    textAlign: "center",
  },
  eventBlockSelected: {
    borderWidth: 2,
    borderColor: MAROON,
  },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: MAROON,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  ghostBtn: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  ghostBtnText: {
    color: TEXT,
    fontWeight: "700",
    fontSize: 16,
  },
});
