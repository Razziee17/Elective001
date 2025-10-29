import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useState } from "react";
import { Text, View } from "react-native";
import GlobalOverlay from "./components/GlobalOverlay";
import { AppointmentProvider } from "./context/AppointmentContext";
import { UserProvider } from "./context/UserContext";
import BottomNav from "./navigation/BottomNav";
import { navigationRef } from "./navigationService"; // ✅ Import global ref
import AboutUs from "./screens/AboutUs";
import ContactUs from "./screens/ContactUs";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import WelcomeScreen from "./screens/WelcomeScreen";


const Stack = createStackNavigator();

export default function App() {
  const [globalMenu, setGlobalMenu] = useState({ visible: false, position: null });
  
  return (
    <UserProvider>
      <AppointmentProvider>
        <NavigationContainer ref={navigationRef}> {/* ✅ Use ref here */}
          <Stack.Navigator initialRouteName="Welcome">
            {/* welcome screen */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }}/>
            {/*login screen  */}
            <Stack.Screen name="Login"component={LoginScreen} options={{ headerShown: false }}/>
            {/*  bottom navs*/}
            <Stack.Screen
              name="Main"
              options={{ headerShown: false }}
              children={() => <BottomNav setGlobalMenu={setGlobalMenu} />} // ✅ correct way
            />


            {/* register routes */}
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}/>
            {/* forgotpassword */}
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }}/>
          {/* About US*/}
          <Stack.Screen name="AboutUs" component={AboutUs} />
          {/*Contact US */}
          <Stack.Screen name="ContactUs" component={ContactUs} />
          </Stack.Navigator>

          {/* 🌑 Global overlay always on top */}
          <GlobalOverlay
            visible={globalMenu.visible}
            onPress={() => setGlobalMenu({ visible: false })}
          >
              {globalMenu.position && (
              <View
                style={{
                  position: "absolute",
                  top: globalMenu.position.top,
                  right: globalMenu.position.right,
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  paddingVertical: 10,
                  
                  width: "45%",
                  alignItems: "center",
                  marginTop: 50,
                  marginRight: 10,
                }}
              >
                {[
                  { name: "About Us", route: "AboutUs" },
                  { name: "Contact Us", route: "ContactUs" },
                  { name: "Logout", route: "Login" },
                ].map((item, index) => (
                  <Text
                    key={index}
                    style={{
                      paddingVertical: 14,
                      color: item.name === "Logout" ? "red" : "#333",
                      fontSize: 16,
                    }}
                    onPress={() => {
                      setGlobalMenu({ visible: false });
                      navigationRef.navigate(item.route);
                    }}
                  >
                    {item.name}
                  </Text>
                ))}
              </View>
            )}
          </GlobalOverlay>

        </NavigationContainer>
      </AppointmentProvider>
    </UserProvider>
  );
}
