import { Tabs } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { useFriends } from "@/context/FriendsContext";
import { lifeplateTheme } from "@/src/theme/lifeplate";

export default function TabLayout() {
  const { pendingShareCount } = useFriends();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lifeplateTheme.colors.primary,
        tabBarInactiveTintColor: "#636E72",
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.tabBarBackground]} />
        ),
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: "#F1F3F5",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="timeline-clock-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarBadge: pendingShareCount > 0 ? pendingShareCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    backgroundColor: "#FFFFFF",
  },
});
