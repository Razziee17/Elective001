import { signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase"; // adjust path if needed

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

  const user = auth.currentUser;

  useEffect(() => {
    const load = async () => {
      try {
        if (!user) return;
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          const defaultData = {
            firstName: "Admin",
            lastName: "",
            email: user.email || "vetplus@admin.com",
            phone: "+1 234-567-8900",
            bio: "Clinic Administrator responsible for managing staff and appointments.",
            department: "Administration",
            employeeID: "VPLUS-ADMIN-001",
            joinDate: new Date().toLocaleDateString(),
          };
          await setDoc(docRef, defaultData);
          setProfile(defaultData);
        }
      } catch (err) {
        console.error("Load profile error:", err);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        ...profile,
        updatedAt: serverTimestamp(),
      });
      setEditMode(false);
      Alert.alert("Success", "Profile saved successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      Alert.alert("Error", "Failed to save profile.");
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

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      {/* <View style={styles.header}>
        
        <View style={styles.userInfo}>
          <Text style={styles.user}>
            {profile.firstName || "Admin"} (Clinic Administrator)
          </Text>

          <TouchableOpacity onPress={() => Alert.alert("Notifications")}>
            <Ionicons name="notifications-outline" size={20} color="#00BFA6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4C4C" />
          </TouchableOpacity>
        </View>
      </View> */}

      <View style={styles.profileContainer}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        {[
          { label: "First Name", key: "firstName" },
          { label: "Last Name", key: "lastName" },
          { label: "Email", key: "email" },
          { label: "Phone", key: "phone" },
          { label: "Bio", key: "bio", multiline: true },
          { label: "Department", key: "department" },
          { label: "Employee ID", key: "employeeID" },
          { label: "Join Date", key: "joinDate" },
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

        <View style={{ marginTop: 14 }}>
          {!editMode ? (
            <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditMode(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {  justifyContent: "center", alignItems: "center" },
  content: {  padding: 20, backgroundColor: "#fff",  flex: 1 },
  header: { marginBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 18, fontWeight: "bold", color: "#00BFA6" },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  user: { fontSize: 14, fontWeight: "600", color: "#333" },
  profileContainer: { flex: 1,   },
  sectionTitle: { fontSize: 24, fontWeight: "bold", color: "#00BFA6", marginBottom: 20 },
  profileField: { marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 6, padding: 10, backgroundColor: "#fff" },
  editableInput: { borderColor: "#00BFA6", backgroundColor: "#F0FFFC" },
  bioInput: { height: 100, textAlignVertical: "top" },
  editButton: { backgroundColor: "#00BFA6", padding: 14, borderRadius: 6, alignItems: "center" },
  editText: { color: "#fff", fontWeight: "bold" },
  saveButton: { backgroundColor: "#007965", padding: 14, borderRadius: 6, alignItems: "center", flex: 1 },
  saveText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  cancelButton: { backgroundColor: "#FF4C4C", padding: 14, borderRadius: 6, alignItems: "center", flex: 1 },
  cancelText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
});
