import { useState, useEffect } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal } from "react-native";
import { sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where, doc, setDoc, getDoc } from "firebase/firestore";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalState, setModalState] = useState({
    show: false,
    message: "",
    type: "", // "error", "otp", "changePassword", "success", "invalidEmail", "otpSending"
    position: "center", // "center" or "upperRight"
  });
  const [generatedOtp, setGeneratedOtp] = useState("");

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const checkEmailExists = async (email) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.log(`Email ${normalizedEmail} found in database`);
        return true;
      } else {
        console.log(`No document found for email ${normalizedEmail}`);
        return false;
      }
    } catch (error) {
      console.error("Error checking email:", error.message, error.code);
      setModalState({ show: true, message: `Error checking email: ${error.message}`, type: "error", position: "center" });
      return false;
    }
  };

  const sendOtpEmail = async (email, otp) => {
    try {
      await setDoc(doc(db, "otp", email), { otp, timestamp: new Date() });
      console.log(`OTP ${otp} sent to ${email}`);
      // TODO: Implement email sending here (e.g., using Firebase Functions or a third-party API like Nodemailer)
      // Example placeholder: await sendEmail(email, `Your OTP is ${otp}`);
    } catch (error) {
      throw new Error("Failed to send OTP");
    }
  };

  const handleReset = async () => {
    if (!email) {
      setModalState({ show: true, message: "Please enter your email address.", type: "error", position: "center" });
      return;
    }

    const emailExists = await checkEmailExists(email);
    if (!emailExists) {
      setModalState({ show: true, message: "Invalid email", type: "invalidEmail", position: "upperRight" });
      return;
    }

    try {
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);
      await sendOtpEmail(email, newOtp);
      // Show OTP sending success modal for 2 seconds
      setModalState({ show: true, message: "OTP is being sent...", type: "otpSending", position: "center" });
      setTimeout(() => {
        setModalState({ show: true, message: "", type: "otp", position: "center" });
      }, 2000); // Increased to 2 seconds
    } catch (error) {
      setModalState({ show: true, message: `An error occurred: ${error.message}`, type: "error", position: "center" });
    }
  };

  const verifyOtp = async () => {
    const otpDoc = await getDoc(doc(db, "otp", email));
    if (otpDoc.exists() && otpDoc.data().otp === otp) {
      setModalState({ show: true, message: "", type: "changePassword", position: "center" });
    } else {
      setModalState({ show: true, message: "Invalid OTP. Please try again.", type: "error", position: "center" });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordRegex.test(newPassword)) {
      setModalState({
        show: true,
        message: "Password must be at least 8 characters with 1 uppercase and 1 special character.",
        type: "error",
        position: "center",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalState({ show: true, message: "Passwords do not match.", type: "error", position: "center" });
      return;
    }

    try {
      // Send password reset email (Firebase's native flow)
      await sendPasswordResetEmail(auth, email);
      // Update password (requires user to be logged in or re-authenticated)
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        console.log(`Password changed successfully for ${email}`);
        setModalState({
          show: true,
          message: "Password changed successfully!",
          type: "success",
          position: "center",
        });
      } else {
        setModalState({
          show: true,
          message: "Please log in to change your password or use the reset link sent to your email.",
          type: "error",
          position: "center",
        });
      }
    } catch (error) {
      setModalState({ show: true, message: `An error occurred: ${error.message}`, type: "error", position: "center" });
    }
  };

  useEffect(() => {
    if (modalState.show && (modalState.type === "error" || modalState.type === "success" || modalState.type === "invalidEmail" || modalState.type === "otpSending")) {
      const timer = setTimeout(() => {
        setModalState({ show: false, message: "", type: "", position: "center" });
        if (modalState.type === "success") {
          navigation.navigate("Login");
        }
      }, 1000); // 1 second for invalidEmail, error, success
      return () => clearTimeout(timer);
    }
    // Remove auto-dismiss for otp modal to allow user interaction
    // if (modalState.show && modalState.type === "otp") {
    //   const timer = setTimeout(() => {
    //     setModalState({ show: false, message: "", type: "", position: "center" });
    //   }, 2000);
    //   return () => clearTimeout(timer);
    // }
  }, [modalState.show, modalState.type]);

  const renderModalContent = () => {
    if (!modalState.show) return null;

    const message = String(modalState.message || "");

    switch (modalState.type) {
      case "error":
        return (
          <View style={styles.errorModal}>
            <Text style={styles.errorText}>{message}</Text>
          </View>
        );
      case "success":
        return (
          <View style={styles.successModal}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        );
      case "invalidEmail":
        return (
          <View style={styles.invalidEmailModal}>
            <Text style={styles.errorText}>{message}</Text>
          </View>
        );
      case "otpSending":
        return (
          <View style={styles.successModal}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        );
      case "otp":
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubtitle}>
              We sent a 6-digit code to your email
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
            />
            <TouchableOpacity style={styles.button} onPress={verifyOtp}>
              <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>
          </View>
        );
      case "changePassword":
        return (
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
              <Text style={styles.buttonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalState.show}
        onRequestClose={() => setModalState({ show: false, message: "", type: "", position: "center" })}
      >
        <View style={styles.modalContainer}>
          {renderModalContent()}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#00BFA6",
    borderRadius: 10,
    margin: 10,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#00BFA6", marginBottom: 25 },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#00BFA6",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  backText: { color: "#00BFA6", marginTop: 15 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00BFA6",
  },
  errorModal: {
    backgroundColor: "#FF4D4D",
    padding: 15,
    borderRadius: 10,
    width: "60%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  successModal: {
    backgroundColor: "#00BFA6",
    padding: 15,
    borderRadius: 10,
    width: "60%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  invalidEmailModal: {
    backgroundColor: "#FF4D4D",
    padding: 10,
    borderRadius: 10,
    width: 150,
    position: "absolute",
    top: 20,
    right: 20,
    borderWidth: 1,
    borderColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  errorText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  successText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
});