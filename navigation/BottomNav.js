import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import AdminAppointmentsHeader from "../components/AdminAppointmentsHeader";
import ErrorBoundary from "../components/ErrorBoundary";
import HomeHeader from "../components/HomeHeader";
import { auth, db } from "../firebase";
import { navigate } from "../navigationService"; // ✅ Import global navigate
import AdminDashboard from "../screens/AdminDashboard";
import AppointmentsScreen from "../screens/AppointmentsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RecordsScreen from "../screens/RecordsScreen";

const Tab = createBottomTabNavigator();

export default function BottomNav() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        setUserRole(docSnap.exists() ? docSnap.data().role || "user" : "user");
      } else {
        setUserRole("user");
      }
    });
    return unsubscribe;
  }, []);

  if (!userRole) return null;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (userRole === "admin") {
            if (route.name === "AdminDashboard")
              iconName = focused ? "home" : "home-outline";
          } else {
            if (route.name === "Home")
              iconName = focused ? "home" : "home-outline";
            else if (route.name === "Appointments")
              iconName = focused ? "calendar" : "calendar-outline";
            else if (route.name === "Records")
              iconName = focused ? "folder" : "folder-outline";
            else if (route.name === "Profile")
              iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#00BFA6",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        header: ({ route }) => {
          const isProfileScreen = route.name === "Profile";

          // ✅ Safe global navigation to nested Profile
          const handleProfilePress = () => {
            if (!isProfileScreen) navigate("Main", { screen: "Profile" });
          };

          if (route.name === "Home" || route.name === "Profile") {
            return (
              <HomeHeader
                onProfilePress={handleProfilePress}
                onNotificationPress={() =>
                  Alert.alert("Notification", "Notification pressed!")
                }
                onMenuPress={() => Alert.alert("Menu", "Menu pressed!")}
                isProfileScreen={isProfileScreen}
              />
            );
          } else if (route.name === "Appointments" && userRole === "admin") {
            return (
              <AdminAppointmentsHeader
                onProfilePress={handleProfilePress}
                onNotificationPress={() =>
                  Alert.alert("Notification", "Notification pressed!")
                }
                onSettingsPress={() =>
                  Alert.alert("Settings", "Settings pressed!")
                }
                isProfileScreen={isProfileScreen}
              />
            );
          } else if (
            route.name === "Appointments" ||
            route.name === "Records"
          ) {
            return (
              <HomeHeader
                onProfilePress={handleProfilePress}
                onNotificationPress={() =>
                  Alert.alert("Notification", "Notification pressed!")
                }
                onMenuPress={() => Alert.alert("Menu", "Menu pressed!")}
                isProfileScreen={isProfileScreen}
              />
            );
          }
          return null;
        },
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#E0F7F4" },
      })}
    >
      {userRole === "admin" ? (
        <Tab.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ title: "Dashboard" }}
        />
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Records" component={RecordsScreen} />
          <Tab.Screen
            name="Appointments"
            component={(props) => (
              <ErrorBoundary>
                <AppointmentsScreen {...props} />
              </ErrorBoundary>
            )}
          />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}
