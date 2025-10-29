import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
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
            <Stack.Screen name="Main"component={BottomNav}options={{ headerShown: false }}/>
            {/* register routes */}
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}/>
            {/* forgotpassword */}
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }}/>
          {/* About US*/}
          <Stack.Screen name="AboutUs" component={AboutUs} />
          {/*Contact US */}
          <Stack.Screen name="ContactUs" component={ContactUs} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppointmentProvider>
    </UserProvider>
  );
}
