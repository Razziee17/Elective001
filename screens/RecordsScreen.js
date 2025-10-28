import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader1";
import { useUser } from "../context/UserContext";
import { db } from "../firebase";

// 🧩 Example simple auth role context
const UserContext = React.createContext({ role: "user" });

export default function RecordsScreen() {
  const [activeTab, setActiveTab] = useState("Appointments");
  const [appointments, setAppointments] = useState([]);
  const { user } = useUser() || {};
  const { role } = useContext(UserContext); // "admin" or "user"

  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [prescription, setPrescription] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: "",
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  // ✅ LIVE FIRESTORE SYNC
  useEffect(() => {
    if (!user?.email) return;
    const q =
      role === "admin"
        ? query(collection(db, "appointments"))
        : query(collection(db, "appointments"), where("owner", "==", user.email));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAppointments(data);
    });
    return unsubscribe;
  }, [user?.email, role]);

  // ✅ UPDATE STATUS OR PRESCRIPTION
  const updateAppointmentStatus = async (id, status, extraData = {}) => {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status,
        ...extraData,
      });
    } catch (e) {
      Alert.alert("Error", "Failed to update appointment.");
    }
  };

  const handleComplete = (appt) => {
    setSelectedAppt(appt);
    setPrescriptionModal(true);
  };

  const savePrescription = async () => {
    if (!prescription.medicine || !prescription.dosage) {
      alert("Please fill in at least medicine name and dosage.");
      return;
    }

    await updateAppointmentStatus(selectedAppt.id, "completed", {
      medication: {
        medicine: prescription.medicine,
        dosage: prescription.dosage,
        duration: prescription.duration,
        notes: prescription.notes,
      },
    });

    setPrescription({
      medicine: "",
      dosage: "",
      duration: "",
      notes: "",
    });
    setPrescriptionModal(false);
  };

  // ✅ FILTERS for tabs
  const pendingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "approved"
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === "completed"
  );
  const declinedAppointments = appointments.filter(
    (a) => a.status === "declined"
  );

  const renderStatusButton = (appt) => {
    if (role !== "admin") {
      return (
        <View
          style={[
            styles.statusButton,
            {
              backgroundColor:
                appt.status === "pending"
                  ? "#f0ad4e"
                  : appt.status === "approved"
                  ? "#5bc0de"
                  : appt.status === "completed"
                  ? "#5cb85c"
                  : appt.status === "declined"
                  ? "#d9534f"
                  : "#999",
            },
          ]}
        >
          <Text style={styles.statusText}>{appt.status.toUpperCase()}</Text>
        </View>
      );
    }

    // ✅ Admin buttons
    return (
      <TouchableOpacity
        onPress={() => {
          if (appt.status === "pending") {
            updateAppointmentStatus(appt.id, "approved");
          } else if (appt.status === "approved") {
            handleComplete(appt);
          }
        }}
        style={[
          styles.statusButton,
          {
            backgroundColor:
              appt.status === "pending"
                ? "#f0ad4e"
                : appt.status === "approved"
                ? "#5bc0de"
                : appt.status === "completed"
                ? "#5cb85c"
                : appt.status === "declined"
                ? "#d9534f"
                : "#999",
          },
        ]}
      >
        <Text style={styles.statusText}>{appt.status.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  };

  const renderAppointment = (appt) => (
    <View key={appt.id} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{appt.petName}</Text>
        <Text style={styles.details}>
          {appt.service} • {appt.date} • {appt.time}
        </Text>

        {/* 🩺 Medication */}
        {appt.medication && typeof appt.medication === "object" && (
          <View style={styles.medsBox}>
            <Text style={styles.medsTitle}>Medication:</Text>
            <Text style={styles.medsItem}>
              💊 {appt.medication.medicine} ({appt.medication.dosage})
            </Text>
            {appt.medication.duration ? (
              <Text style={styles.medsItem}>⏱ {appt.medication.duration}</Text>
            ) : null}
            {appt.medication.notes ? (
              <Text style={styles.medsItem}>🗒️ {appt.medication.notes}</Text>
            ) : null}
          </View>
        )}

        {/* ❌ Decline Notes */}
        {appt.declineNotes ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Decline Notes:</Text>
            <Text style={styles.noteText}>{appt.declineNotes}</Text>
          </View>
        ) : null}

        {/* 📅 Follow-Up */}
        {appt.followUpDate || appt.followUpNotes ? (
          <View style={styles.followUpBox}>
            <Text style={styles.noteTitle}>Follow-Up:</Text>
            {appt.followUpDate ? (
              <Text style={styles.noteText}>📅 {appt.followUpDate}</Text>
            ) : null}
            {appt.followUpNotes ? (
              <Text style={styles.noteText}>🗒️ {appt.followUpNotes}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {renderStatusButton(appt)}
    </View>
  );

  const renderContent = () => {
    if (activeTab === "Appointments") {
      const all = [
        ...pendingAppointments,
        ...declinedAppointments,
        ...completedAppointments,
      ];
      return all.length ? (
        all.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No Appointments</Text>
      );
    }
    if (activeTab === "Medication") {
      return completedAppointments.length ? (
        completedAppointments.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No Medication Records</Text>
      );
    }
    if (activeTab === "History") {
      return appointments.length ? (
        appointments.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No History Yet</Text>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["Appointments", "Medication", "History"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollContainer}>{renderContent()}</ScrollView>

        {/* 🧾 Prescription Modal */}
        {role === "admin" && (
          <Modal visible={prescriptionModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Add Prescription</Text>

                <TextInput
                  placeholder="Medicine Name"
                  style={styles.input}
                  value={prescription.medicine}
                  onChangeText={(text) =>
                    setPrescription((p) => ({ ...p, medicine: text }))
                  }
                />
                <TextInput
                  placeholder="Dosage (e.g., 2x a day)"
                  style={styles.input}
                  value={prescription.dosage}
                  onChangeText={(text) =>
                    setPrescription((p) => ({ ...p, dosage: text }))
                  }
                />
                <TextInput
                  placeholder="Duration (e.g., 5 days)"
                  style={styles.input}
                  value={prescription.duration}
                  onChangeText={(text) =>
                    setPrescription((p) => ({ ...p, duration: text }))
                  }
                />
                <TextInput
                  placeholder="Additional Notes"
                  style={[styles.input, { height: 80 }]}
                  multiline
                  value={prescription.notes}
                  onChangeText={(text) =>
                    setPrescription((p) => ({ ...p, notes: text }))
                  }
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setPrescriptionModal(false)}
                  >
                    <Text style={{ color: "#555" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={savePrescription}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 10, marginTop: -15 },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 50,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTabButton: { backgroundColor: "#00BFA6" },
  tabText: { fontSize: 16, color: "#333", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  scrollContainer: { paddingHorizontal: 20 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  petName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  details: { color: "#666", marginTop: 3 },
  statusButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    justifyContent: "center",
  },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyText: { textAlign: "center", color: "#aaa", marginTop: 40, fontSize: 16 },
  medsBox: {
    marginTop: 8,
    backgroundColor: "#E8FFF9",
    padding: 8,
    borderRadius: 10,
  },
  medsTitle: { fontWeight: "bold", color: "#00BFA6" },
  medsItem: { color: "#333", fontSize: 13, marginTop: 2 },
  noteBox: {
    backgroundColor: "#FFF4F4",
    marginTop: 6,
    padding: 8,
    borderRadius: 10,
  },
  noteTitle: { fontWeight: "bold", color: "#d9534f" },
  noteText: { color: "#333", fontSize: 13, marginTop: 2 },
  followUpBox: {
    backgroundColor: "#F0FAFF",
    marginTop: 6,
    padding: 8,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelButton: { padding: 10, marginRight: 10 },
  saveButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});
