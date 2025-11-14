// app/lib/followStore.ts

import { useEffect, useState } from "react";

export type Person = {
  id: string;
  name: string;
  major: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  scheduleVisible: boolean;
};

const PEOPLE: Person[] = [
  {
    id: "charlotte",
    name: "Charlotte Chan",
    major: "Computer Science",
    bio: "Passionate about AI and machine learning.",
    avatar: "https://i.pravatar.cc/300?img=5",
    followers: 120,
    following: 75,
    scheduleVisible: true,
  },
  {
    id: "sam-patel",
    name: "Sam Patel",
    major: "Physics",
    bio: "Quantum enjoyer. Basketball on Thursdays.",
    avatar: "https://i.pravatar.cc/300?img=11",
    followers: 88,
    following: 41,
    scheduleVisible: true,
  },
  {
    id: "sam-hitchens",
    name: "Sam Hitchens",
    major: "History",
    bio: "Loves discussion groups. Big on study meetups.",
    avatar: "https://i.pravatar.cc/300?img=22",
    followers: 45,
    following: 19,
    scheduleVisible: false, // hidden for testing
  },
  {
    id: "muller",
    name: "Lena Muller",
    major: "Chemistry",
    bio: "Organic chemistry lab assistant.",
    avatar: "https://i.pravatar.cc/300?img=32",
    followers: 64,
    following: 28,
    scheduleVisible: true,
  },
];

export const CURRENT_USER_ID = "charlotte";

// in-memory follow state (session only)
let following = new Set<string>();

// in-memory settings for current user
let notificationsEnabled = true;

let version = 0;
const subs = new Set<(v: number) => void>();
const emit = () => {
  version += 1;
  subs.forEach((fn) => fn(version));
};

// People helpers
export function getPeople(): Person[] {
  return PEOPLE;
}
export function getPerson(id: string): Person | undefined {
  return PEOPLE.find((p) => p.id === id);
}

// Follow helpers
export function isFollowing(id: string): boolean {
  return following.has(id);
}
export function toggleFollow(id: string): void {
  if (following.has(id)) following.delete(id);
  else following.add(id);
  // BACKEND/TODO: sync follow change
  emit();
}

// Schedule visibility (current user)
export function getCurrentScheduleVisible(): boolean {
  const me = getPerson(CURRENT_USER_ID);
  return me?.scheduleVisible ?? true;
}
export function setCurrentScheduleVisible(visible: boolean): void {
  const me = getPerson(CURRENT_USER_ID);
  if (me) {
    me.scheduleVisible = visible;
    // BACKEND/TODO: PATCH /me { scheduleVisible: visible }
    emit();
  }
}

// Notifications (current user)
export function getNotificationsEnabled(): boolean {
  return notificationsEnabled;
}
export function setNotificationsEnabled(enabled: boolean): void {
  notificationsEnabled = enabled;
  // BACKEND/TODO: PATCH /me { notificationsEnabled: enabled }
  emit();
}

// Subscription hook (used wherever we depend on store values)
export function useStoreVersion(): number {
  const [v, setV] = useState(version);
  useEffect(() => {
    const listener = (nv: number) => setV(nv);
    subs.add(listener);
    return () => {
      subs.delete(listener);
    };
  }, []);
  return v;
}
