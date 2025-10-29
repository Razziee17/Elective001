import {
  collection,
  doc,
  getDoc,
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
import { useUser } from "../context/UserContext";
import { db } from "../firebase";

// Role Context
const RoleContext = React.createContext({ role: "user" });

export default function RecordsScreen() {
  const [activeTab, setActiveTab] = useState("Appointments");
  const [appointments, setAppointments] = useState([]);
  const { user } = useUser() || {};
  const { role } = useContext(RoleContext);

  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [prescription, setPrescription] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: "",
  });

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Live sync appointments
  useEffect(() => {
    if (!user?.email) return;

    const baseQuery = collection(db, "appointments");
    const q =
      role === "admin"
        ? query(baseQuery)
        : query(baseQuery, where("owner", "==", user.email));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAppointments(data);
      },
      (error) => {
        console.error("Firestore sync error:", error);
        Alert.alert("Sync Error", "Failed to load appointments.");
      }
    );

    return () => unsubscribe();
  }, [user?.email, role]);

  // Update appointment status
  const updateAppointmentStatus = async (id, status, extraData = {}) => {
    try {
      console.log("Attempting update:", { id, status, extraData });
      await updateDoc(doc(db, "appointments", id), {
        status,
        ...extraData,
      });
      console.log("Update successful");
    } catch (e) {
      console.error("Update failed:", e.code, e.message);
      Alert.alert("Error", `Failed to update: ${e.message}`);
    }
  };

  // Admin: Complete with prescription
  const handleComplete = (appt) => {
    setSelectedAppt(appt);
    setPrescriptionModal(true);
  };

  const savePrescription = async () => {
    if (!prescription.medicine || !prescription.dosage) {
      Alert.alert("Required", "Medicine and dosage are required.");
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

    setPrescription({ medicine: "", dosage: "", duration: "", notes: "" });
    setPrescriptionModal(false);
  };

  // User: Cancel (only pending + only in Appointments tab)
  const handleCancel = (appt) => {
    if (appt.status !== "pending") {
      Alert.alert("Cannot Cancel", "Only pending appointments can be canceled.");
      return;
    }
    setSelectedAppt(appt);
    setCancelReason("");
    setCancelModal(true);
  };

  const cancelAppointment = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Required", "Please provide a reason.");
      return;
    }

    try {
      const docRef = doc(db, "appointments", selectedAppt.id);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        Alert.alert("Error", "Appointment no longer exists.");
        setCancelModal(false);
        return;
      }

      const data = snap.data();
      console.log("Current doc:", { status: data.status, owner: data.owner });
      console.log("User email:", user?.email);

      if (data.status !== "pending") {
        Alert.alert("Error", "This appointment is no longer pending.");
        setCancelModal(false);
        return;
      }

      if (data.owner !== user?.email) {
        Alert.alert("Error", "You can only cancel your own appointments.");
        setCancelModal(false);
        return;
      }

      await updateDoc(docRef, {
        status: "canceled",  // ← American spelling
        cancelNotes: cancelReason.trim(),
      });

      Alert.alert("Success", "Appointment canceled.");
      setCancelModal(false);
    } catch (e) {
      console.error("Cancel error:", e);
      Alert.alert("Error", e.message || "Failed to cancel.");
    }
  };

  // Filter appointments
  const pendingAppointments = appointments.filter((a) => a.status === "pending");
  const approvedAppointments = appointments.filter((a) => a.status === "approved");
  const completedAppointments = appointments.filter((a) => a.status === "completed");
  const declinedAppointments = appointments.filter((a) => a.status === "declined");
  const canceledAppointments = appointments.filter((a) => a.status === "canceled"); // ← American

  const historyAppointments = [
    ...completedAppointments,
    ...declinedAppointments,
    ...canceledAppointments,
  ];

  const isHistoryTab = activeTab === "History";

  // Render status button
  const renderStatusButton = (appt) => {
    if (role !== "admin") {
      // USER VIEW
      if (appt.status === "pending" && !isHistoryTab) {
        return (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.statusButton, { backgroundColor: "#f0ad4e", marginRight: 8 }]}>
              <Text style={styles.statusText}>PENDING</Text>
            </View>
            <TouchableOpacity onPress={() => handleCancel(appt)} style={styles.cancelUserButton}>
              <Text style={styles.cancelUserText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        );
      }

      const statusColor =
        appt.status === "approved"
          ? "#5bc0de"
          : appt.status === "completed"
            ? "#5cb85c"
            : appt.status === "declined"
              ? "#d9534f"
              : appt.status === "canceled"
                ? "#999"
                : "#f0ad4e";

      return (
        <View style={[styles.statusButton, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {appt.status.toUpperCase()}
          </Text>
        </View>
      );
    }

    // ADMIN VIEW
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
                    : "#d9534f",
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

        {appt.medication && (
          <View style={styles.medsBox}>
            <Text style={styles.medsTitle}>Medication:</Text>
            <Text style={styles.medsItem}>
              {appt.medication.medicine} ({appt.medication.dosage})
            </Text>
            {appt.medication.duration && (
              <Text style={styles.medsItem}>{appt.medication.duration}</Text>
            )}
            {appt.medication.notes && (
              <Text style={styles.medsItem}>{appt.medication.notes}</Text>
            )}
          </View>
        )}

        {appt.declineNotes && (
          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>Decline Notes:</Text>
            <Text style={styles.noteText}>{appt.declineNotes}</Text>
          </View>
        )}

        {appt.cancelNotes && (
          <View style={[styles.noteBox, { backgroundColor: "#f9f9f9" }]}>
            <Text style={[styles.noteTitle, { color: "#777" }]}>Cancel Reason:</Text>
            <Text style={styles.noteText}>{appt.cancelNotes}</Text>
          </View>
        )}

        {(appt.followUpDate || appt.followUpNotes) && (
          <View style={styles.followUpBox}>
            <Text style={styles.noteTitle}>Follow-Up:</Text>
            {appt.followUpDate && <Text style={styles.noteText}>{appt.followUpDate}</Text>}
            {appt.followUpNotes && <Text style={styles.noteText}>{appt.followUpNotes}</Text>}
          </View>
        )}
      </View>

      {renderStatusButton(appt)}
    </View>
  );

  const renderContent = () => {
    if (activeTab === "Appointments") {
      const all = [
        ...pendingAppointments,
        ...approvedAppointments,
        ...declinedAppointments,
        ...canceledAppointments,
        ...completedAppointments,
      ];
      return all.length ? all.map(renderAppointment) : <Text style={styles.emptyText}>No Appointments</Text>;
    }

    if (activeTab === "Medication") {
      return completedAppointments.length ? (
        completedAppointments.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No Medication Records</Text>
      );
    }

    if (activeTab === "History") {
      return historyAppointments.length ? (
        historyAppointments.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No History Yet</Text>
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <View style={styles.tabContainer}>
          {["Appointments", "Medication", "History"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollContainer}>{renderContent()}</ScrollView>

        {/* Admin: Prescription Modal */}
        {role === "admin" && (
          <Modal visible={prescriptionModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Add Prescription</Text>

                <TextInput
                  placeholder="Medicine Name *"
                  style={styles.input}
                  value={prescription.medicine}
                  onChangeText={(t) => setPrescription((p) => ({ ...p, medicine: t }))}
                />
                <TextInput
                  placeholder="Dosage (e.g., 2x daily) *"
                  style={styles.input}
                  value={prescription.dosage}
                  onChangeText={(t) => setPrescription((p) => ({ ...p, dosage: t }))}
                />
                <TextInput
                  placeholder="Duration (e.g., 5 days)"
                  style={styles.input}
                  value={prescription.duration}
                  onChangeText={(t) => setPrescription((p) => ({ ...p, duration: t }))}
                />
                <TextInput
                  placeholder="Additional Notes"
                  style={[styles.input, { height: 80 }]}
                  multiline
                  value={prescription.notes}
                  onChangeText={(t) => setPrescription((p) => ({ ...p, notes: t }))}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setPrescriptionModal(false)}>
                    <Text style={{ color: "#555" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={savePrescription}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* User: Cancel Modal */}
        <Modal visible={cancelModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <Text style={{ marginBottom: 10, color: "#555" }}>Why are you canceling?</Text>

              <TextInput
                placeholder="Reason (required)"
                style={[styles.input, { height: 80 }]}
                multiline
                value={cancelReason}
                onChangeText={setCancelReason}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCancelModal(false)}>
                  <Text style={{ color: "#555" }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: "#d9534f" }]}
                  onPress={cancelAppointment}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Confirm Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

// Styles (unchanged)
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
  tabButton: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 30 },
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
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 10 },
  cancelUserButton: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#d9534f",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
  },
  cancelUserText: { color: "#d9534f", fontWeight: "bold", fontSize: 10 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 40, fontSize: 16 },
  medsBox: { marginTop: 8, backgroundColor: "#E8FFF9", padding: 8, borderRadius: 10 },
  medsTitle: { fontWeight: "bold", color: "#00BFA6" },
  medsItem: { color: "#333", fontSize: 13, marginTop: 2 },
  noteBox: { backgroundColor: "#FFF4F4", marginTop: 6, padding: 8, borderRadius: 10 },
  noteTitle: { fontWeight: "bold", color: "#d9534f" },
  noteText: { color: "#333", fontSize: 13, marginTop: 2 },
  followUpBox: { backgroundColor: "#F0FAFF", marginTop: 6, padding: 8, borderRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, marginBottom: 10 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  cancelButton: { padding: 10, marginRight: 10 },
  saveButton: { backgroundColor: "#00BFA6", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
}); 