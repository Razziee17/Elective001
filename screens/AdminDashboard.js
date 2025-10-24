import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, Text, View } from "react-native";
import AdminAppointmentsScreen from "./AdminAppointmentsScreen";
import AdminProfileScreen from "./AdminProfileScreen";
import AdminReportsScreen from "./AdminReportsScreen";
const Tab = createBottomTabNavigator();

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ADMIN DASHBOARD</Text>
        
      </View>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "Appointments") iconName = focused ? "calendar" : "calendar-outline";
            
            else if (route.name === "Reports") iconName = focused ? "document" : "document-outline";
            else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#00BFA6",
          tabBarInactiveTintColor: "#666",
          headerShown: false,
        })}
      >
        <Tab.Screen name="Appointments" component={AdminAppointmentsScreen} />
        
        <Tab.Screen name="Reports" component={AdminReportsScreen} />
        <Tab.Screen name="Profile" component={AdminProfileScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E0F7F4" },
  title: { fontSize: 28, fontWeight: "bold", color: "#00BFA6", textAlign: "center" },
});