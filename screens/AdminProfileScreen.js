import DateTimePicker from "@react-native-community/datetimepicker";
import { signOut } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase";

export default function AdminProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    department: "",
    employeeID: "",
    joinDate: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const user = auth.currentUser;

  // 🔄 Real-time Firestore sync
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(docRef, async (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        const defaultData = {
          firstName: "Admin",
          lastName: "",
          email: user.email || "vetplus@admin.com",
          phone: "+63 000 000 0000",
          bio: "Clinic Administrator responsible for managing staff and appointments.",
          department: "Administration",
          employeeID: "VPLUS-ADMIN-001",
          joinDate: new Date().toLocaleDateString(),
        };
        await setDoc(docRef, defaultData);
        setProfile(defaultData);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...profile,
        updatedAt: serverTimestamp(),
      });
      setEditMode(false);
      Alert.alert("✅ Success", "Profile updated successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString();
      setProfile({ ...profile, joinDate: formatted });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      <View style={styles.profileContainer}>
        <Text style={styles.sectionTitle}>Admin Profile</Text>

        {[
          { label: "First Name", key: "firstName" },
          { label: "Last Name", key: "lastName" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Bio", key: "bio", multiline: true },
          { label: "Department", key: "department" },
          { label: "Employee ID", key: "employeeID" },
        ].map((field) => (
          <View key={field.key} style={styles.profileField}>
            <Text style={styles.label}>{field.label}:</Text>
            <TextInput
              style={[
                styles.input,
                editMode && styles.editableInput,
                field.multiline && styles.bioInput,
              ]}
              value={profile[field.key]}
              editable={editMode}
              multiline={field.multiline}
              onChangeText={(text) => setProfile({ ...profile, [field.key]: text })}
            />
          </View>
        ))}

        {/* 📅 Join Date field */}
        <View style={styles.profileField}>
          <Text style={styles.label}>Join Date:</Text>
          <TouchableOpacity
            onPress={() => editMode && setShowDatePicker(true)}
            disabled={!editMode}
            style={[
              styles.input,
              editMode && styles.editableInput,
              { justifyContent: "center" },
            ]}
          >
            <Text style={{ color: "#333" }}>
              {profile.joinDate || "Select a date"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 📅 Cross-platform Date Picker Modal */}
        {showDatePicker && (
          <Modal
            transparent
            animationType="fade"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.overlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Select Join Date</Text>

                {Platform.OS === "web" ? (
                  <input
                    type="date"
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #ccc",
                      fontSize: 16,
                      marginTop: 10,
                    }}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      const formatted = date.toLocaleDateString();
                      setProfile({ ...profile, joinDate: formatted });
                    }}
                  />
                ) : (
                  <DateTimePicker
                    mode="date"
                    display="spinner"
                    value={new Date()}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Save / Edit buttons */}
        <View style={{ marginTop: 20 }}>
          {!editMode ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(true)}
            >
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditMode(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1, backgroundColor: "#f9f9f9", padding: 20 },
  profileContainer: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 20, elevation: 3 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#00BFA6", marginBottom: 20 },
  profileField: { marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
  },
  editableInput: { borderColor: "#00BFA6", backgroundColor: "#F0FFFC" },
  bioInput: { height: 100, textAlignVertical: "top" },
  editButton: { backgroundColor: "#00BFA6", padding: 14, borderRadius: 6, alignItems: "center" },
  editText: { color: "#fff", fontWeight: "bold" },
  saveButton: { backgroundColor: "#007965", padding: 14, borderRadius: 6, alignItems: "center", flex: 1 },
  saveText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  cancelButton: { backgroundColor: "#FF4C4C", padding: 14, borderRadius: 6, alignItems: "center", flex: 1 },
  cancelText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  logoutButton: {
    backgroundColor: "#eee",
    padding: 12,
    borderRadius: 6,
    marginTop: 20,
    alignItems: "center",
  },
  logoutText: { color: "#333", fontWeight: "600" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "30%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  modalCloseButton: {
    marginTop: 10,
    backgroundColor: "#00BFA6",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCloseText: { color: "#fff", fontWeight: "bold" },
});
