import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";               // <-- your src/firebase.js
import { doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
  // ---- Basic validation -------------------------------------------------
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    Alert.alert("Missing Info", "Please fill in all fields.");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Password Mismatch", "Passwords do not match.");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    Alert.alert("Invalid Email", "Please enter a valid email address.");
    return;
  }

  // ---- Firebase registration --------------------------------------------
  try {
    // 1. Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // 2. Save extra profile data to Firestore (collection "users")
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email: user.email,
      createdAt: new Date().toISOString(),
    });

    Alert.alert("Success", "Account created! You can now log in.");
    navigation.replace("Login"); // or "LoginScreen" if you named it differently
  } catch (error) {
    // ---- Friendly error messages ----------------------------------------
    let msg = "Registration failed. Please try again.";

    switch (error.code) {
      case "auth/email-already-in-use":
        msg = "This email is already registered.";
        break;
      case "auth/weak-password":
        msg = "Password must be at least 6 characters.";
        break;
      case "auth/invalid-email":
        msg = "Invalid email address.";
        break;
      default:
        msg = error.message;
    }

    Alert.alert("Error", msg);
  }
};

  return (
    <View style={styles.container}>
      {/* 🐾 VetPlus Text Logo */}
      <Image
        source={require("../assets/logotext.png")} // first image
        style={styles.textLogo}
        resizeMode="contain"
      />

      {/* 🏥 Clinic Round Logo */}
      <Image
        source={require("../assets/logo.png")} // round clinic logo
        style={styles.clinicLogo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Register Account</Text>

      {/* First & Last Name */}
      <View style={styles.nameRow}>
        <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
          <Ionicons name="person-outline" size={20} color="#00BFA6" />
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <View style={[styles.inputContainer, { flex: 1 }]}>
          <Ionicons name="person-outline" size={20} color="#00BFA6" />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </View>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#00BFA6" />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password */}
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

      {/* Confirm Password */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#00BFA6" />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#00BFA6"
          />
        </TouchableOpacity>
      </View>

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerText}>Register</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}> Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: "#fff", paddingHorizontal: 25 },

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

  nameRow: { flexDirection: "row", justifyContent: "space-between" },

  registerButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
  },
  registerText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  loginText: { color: "#666", fontSize: 14 },
  loginLink: { color: "#00BFA6", fontWeight: "bold", fontSize: 14 },
});
