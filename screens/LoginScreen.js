import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    Alert.alert("✅ Logged In", `Welcome back, ${email}!`);
    navigation.replace("Main");
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert("Enter Email", "Please enter your email to reset password.");
      return;
    }

    Alert.alert(
      "Password Reset",
      "A password reset link will be sent to your email address."
    );
  };

  return (
    <View style={styles.container}>
      {/* 🐾 VetPlus Text Logo */}
      <Image
        source={require("../assets/logotext.png")} // replace with your first image filename
        style={styles.textLogo}
        resizeMode="contain"
      />

      {/* 🏥 Clinic Round Logo */}
      <Image
        source={require("../assets/logo.png")} // replace with your second logo filename
        style={styles.clinicLogo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Log In</Text>

      {/* Email Field */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#00BFA6" />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Password Field */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#00BFA6" />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#00BFA6"
          />
        </TouchableOpacity>
      </View>

      {/* Remember Me + Forgot Password */}
      <View style={styles.row}>
        <View style={styles.rememberMeContainer}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: "#ddd", true: "#00BFA6" }}
            thumbColor={rememberMe ? "#fff" : "#f4f3f4"}
          />
          <Text style={styles.rememberMeText}>Remember Me</Text>
        </View>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>Log In</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don’t have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}> Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#fff", paddingHorizontal: 25, marginTop: -50 },

  textLogo: {
    width: 200,
    height: 70,
    alignSelf: "center",
    marginBottom: 10,
  },
  clinicLogo: {
    width: 130,
    height: 130,
    alignSelf: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00BFA6",
    textAlign: "center",
    marginBottom: 25,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 15, color: "#333" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  rememberMeContainer: { flexDirection: "row", alignItems: "center" },
  rememberMeText: { marginLeft: 5, fontSize: 14, color: "#333" },
  forgotPassword: { color: "#00BFA6", fontWeight: "500" },

  loginButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
  },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  registerText: { color: "#666", fontSize: 14 },
  registerLink: { color: "#00BFA6", fontWeight: "bold", fontSize: 14 },
});
