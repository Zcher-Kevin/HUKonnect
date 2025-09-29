import {
  Image,
  StyleSheet,
  Platform,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import axios from "axios";

// API Configuration for different platforms
const getApiUrl = () => {
  if (Platform.OS === "ios") {
    return "http://localhost:3000";
  } else if (Platform.OS === "android") {
    return "http://10.0.2.2:3000"; // Android emulator
  } else if (Platform.OS === "web") {
    return "http://localhost:3000";
  }
  // For physical devices, you might need to use your computer's IP address
  // return 'http://192.168.1.XXX:3000'; // Replace XXX with your IP
  return "http://localhost:3000";
};

const API_URL = getApiUrl();

export default function HomeScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Attempting to connect to:", API_URL);
      const response = await axios.get(`${API_URL}/api/test`, {
        timeout: 5000, // 5 second timeout
      });
      console.log("Backend response:", response.data);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Connection failed";
      setError(errorMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Welcome to HUKonnect!</Text>
        <Text style={styles.subtitle}>Your campus connection app</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Connect with Students</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Find Study Groups</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Campus Events</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Connection Test</Text>
        <TouchableOpacity
          style={[styles.actionButton, loading && styles.disabledButton]}
          onPress={fetchData}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>
            {loading ? "Loading..." : "Test Backend Connection"}
          </Text>
        </TouchableOpacity>

        {/* Debug Information */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>API URL: {API_URL}</Text>
          <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error: {error}</Text>
          </View>
        )}

        {data && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataText}>
              Backend Response: {JSON.stringify(data, null, 2)}
            </Text>
          </View>
        )}
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  actionButton: {
    backgroundColor: "#2E86AB",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  dataContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  dataText: {
    fontSize: 14,
    fontFamily: "monospace",
    color: "#333",
  },
  debugContainer: {
    backgroundColor: "#e8f4f8",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  errorContainer: {
    backgroundColor: "#ffe6e6",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ffcccc",
  },
  errorText: {
    fontSize: 14,
    color: "#cc0000",
    fontWeight: "500",
  },
});
