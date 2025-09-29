import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Explore HU Campus</Text>
        <Text style={styles.subtitle}>
          Discover events, groups, and opportunities
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>

        <TouchableOpacity style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Study Groups</Text>
          <Text style={styles.categoryDescription}>
            Find or create study groups for your courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Events</Text>
          <Text style={styles.categoryDescription}>
            Campus events and activities happening now
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Clubs & Organizations</Text>
          <Text style={styles.categoryDescription}>
            Join student clubs and organizations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Marketplace</Text>
          <Text style={styles.categoryDescription}>
            Buy, sell, or trade items with other students
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E86AB",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  categoryCard: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#2E86AB",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
