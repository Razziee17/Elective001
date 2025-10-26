import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const validatePassword = (pass) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return passwordRegex.test(pass);
  };

  const validateEmail = (email) => {
    const hasAtSymbol = email.includes("@");
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return { hasAtSymbol, isValid: emailRegex.test(email) };
  };

  const getPasswordMatchText = () => {
    if (confirmPassword === "") return null;
    return password === confirmPassword ? "Passwords match" : "Passwords do not match";
  };

  const getPasswordMatchStyle = () => {
    return password === confirmPassword && confirmPassword !== ""
      ? styles.matchText
      : styles.noMatchText;
  };

  const handleRegister = async () => {
    setFormError("");
    setEmailError("");
    setPasswordError("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setFormError("Need to fill all fields");
      return;
    }

    const { hasAtSymbol, isValid } = validateEmail(email);
    if (!hasAtSymbol || !isValid) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 6 characters and include one uppercase letter, one number, and one special character (!@#$%^&*)."
      );
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email: user.email,
        createdAt: new Date().toISOString(),
      });

      setSuccessModalVisible(true);
    } catch (error) {
      let msg = "Registration failed. Please try again.";
      switch (error.code) {
        case "auth/email-already-in-use":
          msg = "This email is already registered.";
          break;
        case "auth/invalid-email":
          msg = "Invalid email address.";
          break;
        case "auth/weak-password":
          msg = "Password is too weak.";
          break;
        default:
          msg = `Error: ${error.message}`;
      }
      Alert.alert("Error", msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => {
          setSuccessModalVisible(false);
          navigation.replace("Login");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={30} color="#00BFA6" />
            <Text style={styles.modalText}>Registration Successful</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.replace("Login");
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scroll-safe centered layout */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Image
            source={require("../assets/logotext.png")}
            style={styles.textLogo}
            resizeMode="contain"
          />
          <Image
            source={require("../assets/logo.png")}
            style={styles.clinicLogo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Register Account</Text>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

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

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#00BFA6" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#00BFA6" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(
                  validatePassword(text)
                    ? ""
                    : "Password must include one uppercase letter, one number, and one special character (!@#$%^&*)."
                );
                setFormError("");
              }}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#00BFA6"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#00BFA6" />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setFormError("");
              }}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#00BFA6"
              />
            </TouchableOpacity>
          </View>

          {getPasswordMatchText() && (
            <Text style={getPasswordMatchStyle()}>{getPasswordMatchText()}</Text>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}> Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    overflow: "hidden", // removes unwanted scrollbars
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  formContainer: {
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
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
    width: "100%",
    outlineStyle: "none", // Removes blue outline (web)
    transition: "border-color 0.2s ease", // smooth focus transition (web)
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
     outlineStyle: "none",              // ❌ removes blue autofill/focus ring
  backgroundColor: "transparent",    // ensures autofill doesn’t add blue fill
  boxShadow: "0 0 0px 1000px #fff inset", // ✅ kills autofill blue overlay
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  registerButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  registerText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  loginText: { color: "#666", fontSize: 14 },
  loginLink: { color: "#00BFA6", fontWeight: "bold", fontSize: 14 },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  matchText: {
    color: "green",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  noMatchText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
    maxWidth: 300,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00BFA6",
    marginVertical: 10,
  },
  modalButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  
});
