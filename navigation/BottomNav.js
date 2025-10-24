import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import AdminDashboard from "../screens/AdminDashboard";
import AppointmentsScreen from "../screens/AppointmentsScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RecordsScreen from "../screens/RecordsScreen";

const Tab = createBottomTabNavigator();

export default function BottomNav() {
  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          setUserRole(docSnap.data().role || "user");
        }
      }
    });
    return unsubscribe;
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (userRole === "admin") {
            if (route.name === "AdminDashboard") iconName = focused ? "home" : "home-outline";
          } else {
            if (route.name === "Home") iconName = focused ? "home" : "home-outline";
            else if (route.name === "Records") iconName = focused ? "folder" : "calendar-outline";
            else if (route.name === "Appointments") iconName = focused ? "calendar" : "calendar-outline";
            else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#00BFA6",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#E0F7F4" },
      })}
    >
      {userRole === "admin" ? (
        <Tab.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: "Dashboard" }} />
      ) : (
        <>
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
          <Tab.Screen name="Records" component={RecordsScreen} options={{ title: "Records" }} />
          <Tab.Screen name="Appointments" component={AppointmentsScreen} options={{ title: "Appointments" }} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
        </>
      )}
    </Tab.Navigator>
  );
}