import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { auth, db } from "../firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Info", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting login with email:", email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Authenticated user:", user.uid);

      const docRef = doc(db, "users", user.uid);
      console.log("Accessing Firestore document: users/", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const role = data.role || "user";
        console.log(`User role: ${role}, Admin: ${role === "admin"}`);
      } else {
        console.log("User document does not exist, creating one for:", user.uid);
        await setDoc(docRef, {
          email: user.email,
          role: "user", // Default role
          createdAt: serverTimestamp(),
        });
        console.log("User document created with role: user");
      }

      navigation.replace("Main");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
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
      <Image source={require("../assets/logotext.png")} style={styles.textLogo} resizeMode="contain" />
      <Image source={require("../assets/logo.png")} style={styles.clinicLogo} resizeMode="contain" />

      <Text style={styles.title}>Log In</Text>

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

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.loginText}>{loading ? "Logging In..." : "Log In"}</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerLink}> Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 40,
  },
  textLogo: {
    width: 160,
    height: 60,
    marginBottom: 10,
  },
  clinicLogo: {
    width: 120,
    height: 120,
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
    width: "85%",
    maxWidth: 350,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "85%",
    maxWidth: 350,
    marginVertical: 10,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
  },
  forgotPassword: {
    color: "#00BFA6",
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 14,
    borderRadius: 30,
    width: "85%",
    maxWidth: 350,
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  registerText: {
    color: "#666",
    fontSize: 14,
  },
  registerLink: {
    color: "#00BFA6",
    fontWeight: "bold",
    fontSize: 14,
  },
});