// app/(tabs)/people.tsx

import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Alert,
} from "react-native";
import { BouncyButton } from "../../components/BouncyButton";
import { TabTransitionView } from "../../components/TabTransitionView";
import { router } from "expo-router";
import { isFollowing, useStoreVersion, Person, setFollowingIds } from "../lib/followStore";
import { subscribeAuthChange } from "../lib/authEvents";
import axios from "axios";
import { getItem as storageGetItem } from "../lib/storage";
import { API_BASE } from "../lib/config";

const BG = "#FFF7F7";
const TEXT = "#231F20";
const SUB = "#7A6F6F";
const MAROON = "#A2172C";
const CARD = "#FFFFFF";

const { width: W } = Dimensions.get("window");
const WRAP_W = Math.min(900, W * 0.98);

export default function PeopleScreen() {
  const [query, setQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // re-render when follow / visibility / settings change
  const storeVersion = useStoreVersion();
  // Server-backed users
  const [users, setUsers] = useState<Person[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch users from backend (search + paging). Maps server user shape to local Person.
  const fetchLock = React.useRef(false);
  const fetchUsers = async (opts?: { page?: number; reset?: boolean }) => {
    const p = opts?.page ?? page;
    const reset = !!opts?.reset;
    try {
      if (fetchLock.current) return; // avoid overlapping fetches
      fetchLock.current = true;
      if (p === 1) setLoading(true);
      const token = await storageGetItem("token");
      const res = await axios.get(`${API_BASE}/api/users/search`, {
        params: {
          query: query || undefined,
          page: p,
          limit,
          excludeSelf: true,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        timeout: 15000,
      });
      const serverUsers = res.data?.users || [];
      // map server user to local Person-like shape
      const mapped: Person[] = serverUsers.map((u: any) => ({
        id: String(u._id || u.id || u.username),
        name:
          u.firstName ||
          u.username ||
          `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
          u.username ||
          "User",
        major: u.major || "",
        bio: u.bio || "",
        // Use explicit profilePicture when available. Otherwise fall back to a
        // single, neutral app-local icon (do not generate random avatars).
        // We intentionally avoid per-user random images to match the requested UX.
        avatar: u.profilePicture || null,
        followers: u.followers || 0,
        following: u.following || 0,
        scheduleVisible: !!u.schedule,
      }));

      // Exclude the current user from results so you don't see yourself.
      const filtered = currentUserId
        ? mapped.filter((m) => m.id !== currentUserId)
        : mapped;

      if (reset || p === 1) setUsers(filtered);
      else setUsers((prev) => [...prev, ...filtered]);

      const pagination = res.data?.pagination;
      if (pagination) setTotalPages(pagination.pages || 1);
    } catch (err) {
      console.error("fetchUsers error", err);
    } finally {
      fetchLock.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchUsers({ page: 1, reset: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Fetch current user id so we can exclude the current user from lists/selections
  React.useEffect(() => {
    // On mount read current token, fetch profile and initial users
    let mounted = true;
    (async () => {
      try {
        const token = await storageGetItem("token");
        if (!mounted) return;
        if (!token) {
          setCurrentUserId(null);
          // still try to fetch users (will 401 and leave empty)
          fetchUsers({ page: 1, reset: true });
          return;
        }
        const res = await axios.get(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        const uid = res?.data?.user?._id || res?.data?.user?.id || null;
        if (mounted) setCurrentUserId(uid ? String(uid) : null);
        // Initialize following set from server so UI ordering and buttons
        // reflect server state immediately.
        try {
          const resF = await axios.get(`${API_BASE}/api/users/following`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
          });
          const arr = Array.isArray(resF?.data?.following) ? resF.data.following.map((x: any) => String(x)) : [];
          setFollowingIds(arr);
        } catch (e) {
          // ignore
        }
        // fetch first page of users now that we have token
        fetchUsers({ page: 1, reset: true });
      } catch (err: any) {
        console.warn(
          "Could not fetch current user id",
          (err as any)?.message || err
        );
        if (mounted) setCurrentUserId(null);
        fetchUsers({ page: 1, reset: true });
      }
    })();

    // Subscribe to auth change events (fired when login/register stores token)
    const unsub = subscribeAuthChange(() => {
      (async () => {
        try {
          const token = await storageGetItem("token");
          if (!mounted) return;
          if (token) {
            try {
              const res = await axios.get(`${API_BASE}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000,
              });
              const uid = res?.data?.user?._id || res?.data?.user?.id || null;
              if (mounted) setCurrentUserId(uid ? String(uid) : null);
            } catch (e) {
              if (mounted) setCurrentUserId(null);
            }
          } else {
            if (mounted) setCurrentUserId(null);
          }
          // reload users
          if (mounted) {
            setUsers([]);
            setPage(1);
            fetchUsers({ page: 1, reset: true });
          }
        } catch (e) {}
      })();
    });
    // cleanup on unmount
    return () => {
      mounted = false;
      try {
        unsub();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When we learn the current user id, refresh the first page so the
  // current user is excluded from results even if the initial fetch ran
  // before we knew the id.
  React.useEffect(() => {
    if (currentUserId === undefined) return;
    // fetch first page and reset so filtering takes effect
    fetchUsers({ page: 1, reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Load next page when `page` changes (except page 1 which is handled by search effect)
  React.useEffect(() => {
    if (page === 1) return;
    fetchUsers({ page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Data ordering: show followed first (recompute when follow-set changes)
  const data: Person[] = useMemo(() => {
    const followed = users.filter((p) => isFollowing(p.id));
    const others = users.filter((p) => !isFollowing(p.id));
    return [...followed, ...others];
  }, [users, storeVersion]);

  // How many items at the start of `data` are followed users
  const followedCount = useMemo(() => users.filter((p) => isFollowing(p.id)).length, [users, storeVersion]);

  const renderItem = ({ item }: { item: Person }) => (
    <View>
      <View style={styles.card}>
      <View style={styles.leftRow}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          // Local neutral icon (use project icon as a neutral user avatar).
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.avatar}
            resizeMode="cover"
          />
        )}
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.major}>{item.major}</Text>
          <Text style={styles.bio} numberOfLines={1}>
            {item.bio || "…"}
          </Text>
        </View>
      </View>
        <BouncyButton
          style={styles.viewBtn}
          onPress={() => router.push(`/user/${item.id}`)}
        >
          <Text style={styles.viewText}>View</Text>
        </BouncyButton>
      </View>

      {/* Divider between followed and other users */}
      {followedCount > 0 && followedCount < data.length &&
        // If this item is the last followed item, render a divider
        data.indexOf(item) === followedCount - 1 && (
          <View style={styles.followDividerWrap}>
            <View style={styles.followDivider} />
          </View>
        )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <TabTransitionView style={[styles.inner, { width: WRAP_W }]}>
        <Text style={styles.title}>Find Students</Text>

        <TextInput
          style={styles.search}
          placeholder="Search by name"
          placeholderTextColor={SUB}
          value={query}
          onChangeText={setQuery}
        />

        {data.length === 0 && !query && (
          <Text style={styles.empty}>
            You&apos;re not following anyone yet. Search to discover students.
          </Text>
        )}

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          onEndReached={() => {
            if (!loading && page < totalPages) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.5}
        />
      </TabTransitionView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: Platform.select({ ios: 8, android: 8, web: 16 }),
    alignItems: "center",
  },
  inner: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 10,
  },
  search: {
    backgroundColor: "#F6EAEA",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT,
    marginBottom: 12,
  },
  empty: {
    marginTop: 12,
    color: SUB,
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
  },
  major: {
    fontSize: 13,
    fontWeight: "600",
    color: MAROON,
  },
  bio: {
    fontSize: 11,
    color: SUB,
    marginTop: 2,
    maxWidth: 260,
  },
  viewBtn: {
    backgroundColor: MAROON,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  viewText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  followDividerWrap: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  followDivider: {
    height: 1,
    alignSelf: 'stretch',
    backgroundColor: '#E6E6E6',
    borderRadius: 1,
  },
});
