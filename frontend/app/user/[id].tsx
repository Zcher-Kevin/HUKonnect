// app/user/[id].tsx
import React, { useMemo } from "react";
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";
const CARD = "#fff";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(420, W * 0.92);

// Mock directory (keep in sync with app/(tabs)/events.tsx)
const PEOPLE: Record<
    string,
    {
        id: string;
        name: string;
        major: string;
        bio: string;
        avatar: string;
        followers: number;
        following: number;
        events: { title: string; color: string; start: number; end: number; dayIdx: number }[];
    }
> = {
    charlotte: {
        id: "charlotte",
        name: "Charlotte Chan",
        major: "Computer Science",
        bio: "Passionate about AI and machine learning.",
        avatar: "https://i.pravatar.cc/300?img=5",
        followers: 120,
        following: 75,
        events: [
            { title: "Physics Lecture", color: "#B2F2E8", start: 9 * 60, end: 10 * 60, dayIdx: 0 },
            { title: "Math Class", color: "#E5C6FF", start: 14 * 60, end: 15 * 60, dayIdx: 0 },
            { title: "Group Study", color: "#B2F2E8", start: 10 * 60, end: 11 * 60, dayIdx: 2 },
            { title: "Art Workshop", color: "#CFE2FF", start: 18 * 60, end: 19 * 60, dayIdx: 4 },
        ],
    },
    sam: {
        id: "sam",
        name: "Sam Patel",
        major: "Physics",
        bio: "Quantum enjoyer. Basketball on Thursdays.",
        avatar: "https://i.pravatar.cc/300?img=11",
        followers: 88,
        following: 41,
        events: [{ title: "Quantum Seminar", color: "#CFE2FF", start: 11 * 60, end: 12 * 60, dayIdx: 2 }],
    },
    muller: {
        id: "muller",
        name: "Lena Muller",
        major: "Chemistry",
        bio: "Organic chemistry lab assistant.",
        avatar: "https://i.pravatar.cc/300?img=32",
        followers: 64,
        following: 28,
        events: [{ title: "Chem Lab", color: "#FFD6A5", start: 16 * 60, end: 17 * 60, dayIdx: 1 }],
    },
};

/* BACKEND NOTES (concise)
  GET /people/:id                          → { id, name, major, bio, avatarUrl, followers, following, scheduleVisible }
  GET /people/:id/schedule?preview=true    → Event[]
  When wired, replace PEOPLE[...] with fetched data and handle scheduleVisible=false by hiding the preview.
*/

const START_HOUR = 7;
const END_HOUR = 20;
const H = 44; // preview row height

export default function UserProfile() {
    const params = useLocalSearchParams<{ id?: string }>();
    const routeId = params.id || "charlotte";
    const person = PEOPLE[routeId] || {
        id: "unknown",
        name: "Student",
        major: "Unknown",
        bio: "—",
        avatar: "https://i.pravatar.cc/300?u=unknown",
        followers: 0,
        following: 0,
        events: [],
    };

    // Show 5 preview columns (example labels only)
    const days = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);
    const times = useMemo(
        () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
        []
    );

    const eventsForDay = (idx: number) => (person.events || []).filter((e) => e.dayIdx === idx);

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 24 }}>
                <View style={[styles.headerWrap, { width: WRAP_W }]}>
                    <Text style={styles.pageTitle}>Student Profile</Text>

                    <Image source={{ uri: person.avatar }} style={styles.avatar} />

                    <Text style={styles.name}>{person.name}</Text>
                    <Text style={styles.sub}>{`Major: ${person.major}\nBio: ${person.bio}`}</Text>
                    <Text style={styles.meta}>
                        {person.followers} Followers{"  "} {person.following} Following
                    </Text>

                    <TouchableOpacity style={styles.followBtn} activeOpacity={0.9}>
                        <Text style={styles.followText}>Follow</Text>
                    </TouchableOpacity>
                </View>

                {/* Schedule preview */}
                <View style={[styles.previewCard, { width: WRAP_W }]}>
                    <View style={styles.daysHeader}>
                        {["Thu", "Fri", "Sat", "Sun", "Mon"].map((d, i) => (
                            <View key={d} style={[styles.dayHead, i === 0 && styles.today]}>
                                <Text style={[styles.dayText, i === 0 && styles.todayText]}>{d}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={{ flexDirection: "row" }}>
                        {days.map((idx) => (
                            <View key={idx} style={styles.col}>
                                <View style={{ position: "relative", height: (END_HOUR - START_HOUR) * H }}>
                                    {times.map((t, i) => (
                                        <View key={t} style={[styles.row, i % 2 === 0 && styles.alt]} />
                                    ))}
                                    {eventsForDay(idx).map((e, k) => {
                                        const top = ((e.start - START_HOUR * 60) / 60) * H;
                                        const height = ((e.end - e.start) / 60) * H;
                                        return (
                                            <View
                                                key={k}
                                                style={[styles.block, { top, height, backgroundColor: e.color }]}
                                            >
                                                <Text style={styles.blockTitle} numberOfLines={1}>
                                                    {e.title}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.cta, { width: WRAP_W }]}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/user/[id]/schedule", params: { id: person.id } })}
                >
                    <Text style={styles.ctaText}>View Full Schedule</Text>
                </TouchableOpacity>


                {/* Message → open 1:1 chat for this user */}
                <TouchableOpacity
                    style={[styles.ghost, { width: WRAP_W }]}
                    activeOpacity={0.9}
                    onPress={() => router.push({ pathname: "/messages/[id]", params: { id: person.id } })}
                >
                    <Text style={styles.ghostText}>Message</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG },
    headerWrap: { alignItems: "center", gap: 8, paddingTop: 10, paddingBottom: 8 },
    pageTitle: { fontSize: 18, fontWeight: "800", color: TEXT, alignSelf: "flex-start" },
    avatar: { width: 120, height: 120, borderRadius: 60, marginTop: 8, backgroundColor: "#eee" },
    name: { fontSize: 18, fontWeight: "800", color: TEXT, marginTop: 8 },
    sub: { color: SUB, textAlign: "center", marginTop: 4 },
    meta: { color: SUB, marginTop: 4 },

    followBtn: {
        marginTop: 10,
        backgroundColor: MAROON,
        borderRadius: 999,
        paddingVertical: 12,
        paddingHorizontal: 28,
    },
    followText: { color: "#fff", fontWeight: "700" },

    previewCard: {
        backgroundColor: CARD,
        borderRadius: 16,
        padding: 12,
        marginTop: 12,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    daysHeader: { flexDirection: "row", gap: 8, marginBottom: 8 },
    dayHead: { backgroundColor: "#F4F6FF", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    today: { backgroundColor: "#EAE6F0" },
    dayText: { fontWeight: "800", color: TEXT },
    todayText: { color: MAROON },

    col: { width: (WRAP_W - 24) / 5, marginHorizontal: 2 },
    row: { height: H, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#eee" },
    alt: { backgroundColor: "#FAFAFA" },

    block: { position: "absolute", left: 4, right: 4, borderRadius: 10, padding: 6 },
    blockTitle: { fontSize: 11, fontWeight: "700", color: "#1d1d1f" },

    cta: {
        marginTop: 12,
        backgroundColor: MAROON,
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
    },
    ctaText: { color: "#fff", fontWeight: "700" },

    ghost: {
        marginTop: 10,
        backgroundColor: "#fff",
        borderRadius: 999,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#E6E6E6",
    },
    ghostText: { color: TEXT, fontWeight: "700" },
});
