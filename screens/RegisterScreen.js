import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Validation Functions
  const validatePassword = (pass) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return passwordRegex.test(pass);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  // Format phone as user types: (123) 456-7890
  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhone(text);
    setPhone(formatted);
    setPhoneError("");
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

  const getResponsiveWidth = (baseWidth) => (baseWidth / 400) * Math.min(windowWidth, 400);
  const getResponsivePadding = (basePadding) => (basePadding / 400) * Math.min(windowWidth, 400);

  const handleRegister = async () => {
    // Reset errors
    setFormError("");
    setEmailError("");
    setPasswordError("");
    setPhoneError("");

    // Required fields
    if (!firstName || !lastName || !email || !phone || !address || !password || !confirmPassword) {
      setFormError("Please fill in all fields");
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    // Phone validation
    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (10 digits)");
      return;
    }

    // Password validation
    if (!validatePassword(password)) {
      setPasswordError(
        "Password must be 6+ chars, with 1 uppercase, 1 number, 1 special char (!@#$%^&*)"
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

      await sendEmailVerification(user);

      // Save full user profile
     await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email: user.email,
      phone,
      address,
      createdAt: new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
    });

      setSuccessModalVisible(true);
    } catch (error) {
      let msg = "Registration failed. Please try again.";
      switch (error.code) {
        case "auth/email-already-in-use":
          setEmailError("This email is already registered.");
          break;
        case "auth/invalid-email":
          setEmailError("Invalid email address.");
          break;
        case "auth/weak-password":
          setPasswordError("Password is too weak.");
          break;
        default:
          msg = `Error: ${error.message}`;
          Alert.alert("Error", msg);
      }
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
            <Ionicons name="checkmark-circle" size={50} color="#00BFA6" />
            <Text style={styles.modalText}>Registration Successful!</Text>
            <Text style={styles.modalSubText}>
              Please check your email to verify your account.
            </Text>
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

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formContainer, { width: getResponsiveWidth(360) }]}>
          {/* Logo */}
          <Image
            source={require("../assets/logotext.png")}
            style={[styles.textLogo, { width: getResponsiveWidth(200), height: getResponsiveWidth(70) }]}
            resizeMode="contain"
          />
          <Image
            source={require("../assets/logo.png")}
            style={[styles.clinicLogo, { width: getResponsiveWidth(130), height: getResponsiveWidth(130) }]}
            resizeMode="contain"
          />

          <Text style={styles.title}>Register Account</Text>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          {/* Name Row */}
          <View style={[styles.nameRow, { width: getResponsiveWidth(360) }]}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="person-outline" size={20} color="#00BFA6" />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Ionicons name="person-outline" size={20} color="#00BFA6" />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View style={[styles.inputContainer, { width: getResponsiveWidth(360) }]}>
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

          {/* Phone Number */}
          <View style={[styles.inputContainer, { width: getResponsiveWidth(360) }]}>
            <Ionicons name="call-outline" size={20} color="#00BFA6" />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

          {/* Address */}
          <View style={[styles.inputContainer, { width: getResponsiveWidth(360), minHeight: 60 }]}>
            <Ionicons name="location-outline" size={20} color="#00BFA6" style={{ marginTop: 5 }} />
            <TextInput
              style={[styles.input, { minHeight: 50, textAlignVertical: "top" }]}
              placeholder="Full Address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputContainer, { width: getResponsiveWidth(360) }]}>
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
                    : "6+ chars, 1 uppercase, 1 number, 1 special (!@#$%^&*)"
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

          {/* Confirm Password */}
          <View style={[styles.inputContainer, { width: getResponsiveWidth(360) }]}>
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

          {/* Password Match Indicator */}
          {getPasswordMatchText() && (
            <Text style={getPasswordMatchStyle()}>{getPasswordMatchText()}</Text>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              { width: getResponsiveWidth(360), paddingVertical: getResponsivePadding(14) },
            ]}
            onPress={handleRegister}
          >
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
      </ScrollView>
    </View>
  );
}

// Styles (unchanged, just cleaned up)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  formContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  textLogo: {
    alignSelf: "center",
    marginBottom: 10,
  },
  clinicLogo: {
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
    backgroundColor: "#fff",
      overflow: "hidden",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
    borderWidth: 0, 
    outlineStyle: "none",
    padding: 0,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  registerButton: {
    backgroundColor: "#00BFA6",
    borderRadius: 30,
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#00BFA6",
    fontWeight: "bold",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  matchText: {
    color: "green",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  noMatchText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
    maxWidth: 320,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00BFA6",
    marginVertical: 10,
  },
  modalSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});