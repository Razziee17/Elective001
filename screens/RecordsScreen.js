// RecordsScreen.js
// Long-form full file — includes Admin "Done" (prescription) and "Follow-up" flows + realtime Firestore sync.
// Keep this file structure (large file) similar to your original to minimize diffs in UI layout.

import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
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
import { useUser } from "../context/UserContext";
import { db } from "../firebase";

// Date picker
// NOTE: This depends on @react-native-community/datetimepicker which is common in RN projects.
// If you don't have it installed, run: npm i @react-native-community/datetimepicker
import DateTimePicker from "@react-native-community/datetimepicker";

const RoleContext = React.createContext({ role: "user" });

export default function RecordsScreen() {
  // UI tabs
  const [activeTab, setActiveTab] = useState("Appointments");

  // Firestore data
  const [appointments, setAppointments] = useState([]);

  // user & role
  const { user } = useUser() || {};
  const { role } = useContext(RoleContext);

  // --- ADMIN: prescription (Done) modal state ---
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [prescription, setPrescription] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: "",
  });

  // --- ADMIN: follow-up modal state ---
  const [followUpModal, setFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- USER: cancel flow ---
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // --- ADMIN: decline flow ---
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Helper: build query depending on role
  const getAppointmentsQuery = () => {
    const base = collection(db, "appointments");
    // Role "admin" sees all; users see their own by owner/email
    return role === "admin"
      ? query(base, orderBy("createdAt", "desc"))
      : query(base, where("owner", "==", user?.email), orderBy("createdAt", "desc"));
  };

  // Real-time listener
  useEffect(() => {
    if (!user?.email && role !== "admin") return;

    const q = getAppointmentsQuery();
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const docData = d.data();
          // Remove any accidentally saved fake client id prop
          if (docData.id) delete docData.id;
          return { id: d.id, ...docData };
        });
        setAppointments(data);
      },
      (error) => {
        console.error("Firestore sync error:", error);
        Alert.alert("Sync Error", "Failed to load appointments from server.");
      }
    );

    return () => unsubscribe();
    // depend on user.email and role
  }, [user?.email, role]);

  // Generic update helper
  const updateAppointmentStatus = async (id, status, extraData = {}) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status, ...extraData });
    } catch (e) {
      console.error("Update failed:", e);
      Alert.alert("Update Failed", "Could not update appointment. Check console for details.");
    }
  };

  // -------------------------
  // Admin: Complete (Prescription) flow
  // -------------------------
  const handleComplete = (appt) => {
    // open prescription modal; admin must enter med + dosage
    setSelectedAppt(appt);
    setPrescription({
      medicine: "",
      dosage: "",
      duration: "",
      notes: "",
    });
    setPrescriptionModal(true);
  };

  const savePrescription = async () => {
    // validation
    if (!prescription.medicine.trim() || !prescription.dosage.trim()) {
      Alert.alert("Required", "Please provide medicine name and dosage.");
      return;
    }
    if (!selectedAppt?.id) {
      Alert.alert("Error", "No appointment selected.");
      return;
    }

    try {
      // update appointment: status -> "done", store medication object and timestamp
      await updateDoc(doc(db, "appointments", selectedAppt.id), {
        status: "done", // canonical "done"
        medication: {
          medicine: prescription.medicine.trim(),
          dosage: prescription.dosage.trim(),
          duration: prescription.duration?.trim() || "",
          notes: prescription.notes?.trim() || "",
          savedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      });

      // close modal & reset
      setPrescriptionModal(false);
      setSelectedAppt(null);
      setPrescription({ medicine: "", dosage: "", duration: "", notes: "" });
      Alert.alert("Saved", "Prescription saved and appointment marked DONE.");
    } catch (err) {
      console.error("savePrescription error:", err);
      Alert.alert("Error", "Failed to save prescription.");
    }
  };

  // -------------------------
  // Admin: Follow-Up flow
  // -------------------------
  const openFollowUpModal = (appt) => {
    setSelectedAppt(appt);
    setFollowUpNotes(appt.followUpNotes || "");
    // default date: either existing followUpDate or tomorrow
    if (appt.followUpDate) {
      // try to parse if it's ISO or timestamp
      let parsed = null;
      try {
        parsed = new Date(appt.followUpDate);
        if (isNaN(parsed)) parsed = new Date();
      } catch {
        parsed = new Date();
      }
      setFollowUpDate(parsed);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFollowUpDate(tomorrow);
    }
    setFollowUpModal(true);
  };

  const onChangeDate = (event, selected) => {
    // for Android the event may be dismissed
    const currentDate = selected || followUpDate;
    setShowDatePicker(Platform.OS === "ios"); // on iOS keep it open; on Android dismiss
    setFollowUpDate(currentDate);
  };

  const saveFollowUp = async () => {
    if (!selectedAppt?.id) {
      Alert.alert("Error", "No appointment selected.");
      return;
    }
    if (!followUpDate) {
      Alert.alert("Required", "Please pick a date for follow-up.");
      return;
    }

    try {
      // store followUpDate as ISO string (easy to read and parse across platforms)
      await updateDoc(doc(db, "appointments", selectedAppt.id), {
        status: "follow-up",
        followUpDate: followUpDate.toISOString(),
        followUpNotes: followUpNotes?.trim() || "",
        updatedAt: new Date(),
      });

      setFollowUpModal(false);
      setSelectedAppt(null);
      setFollowUpNotes("");
      Alert.alert("Saved", "Follow-up scheduled.");
    } catch (err) {
      console.error("saveFollowUp error:", err);
      Alert.alert("Error", "Failed to save follow-up.");
    }
  };

  // -------------------------
  // Admin: Decline flow (existing)
  // -------------------------
  const openDeclineModal = (appt) => {
    if (appt.status !== "pending") return;
    setSelectedAppt(appt);
    setDeclineReason("");
    setShowDeclineModal(true);
  };

  const confirmDecline = async () => {
    if (!declineReason.trim()) {
      Alert.alert("Required", "Please provide a reason.");
      return;
    }
    try {
      await updateDoc(doc(db, "appointments", selectedAppt.id), {
        status: "declined",
        declineNotes: declineReason.trim(),
        updatedAt: new Date(),
      });

      setShowDeclineModal(false);
      setSelectedAppt(null);
      setDeclineReason("");
      Alert.alert("Declined", "Appointment declined.");
    } catch (e) {
      console.error("Decline error:", e);
      Alert.alert("Error", "Failed to decline appointment.");
    }
  };

  // -------------------------
  // User: Cancel flow (existing)
  // -------------------------
  const openCancelModal = (appt) => {
    if (appt.status !== "pending") {
      Alert.alert("Cannot Cancel", "Only pending appointments can be canceled.");
      return;
    }
    setSelectedAppt(appt);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert("Required", "Please provide a reason.");
      return;
    }
    try {
      await updateDoc(doc(db, "appointments", selectedAppt.id), {
        status: "canceled",
        cancelNotes: cancelReason.trim(),
        updatedAt: new Date(),
      });

      setShowCancelModal(false);
      setSelectedAppt(null);
      setCancelReason("");
      Alert.alert("Cancelled", "Appointment has been cancelled.");
    } catch (e) {
      console.error("Cancel error:", e);
      Alert.alert("Error", "Failed to cancel appointment.");
    }
  };

  // -------------------------
  // Filters & grouped lists (backwards-compatible)
  // -------------------------
  const pendingAppointments = appointments.filter((a) => a.status === "pending");
  const approvedAppointments = appointments.filter((a) => a.status === "approved");
  // completedAppointments should include both legacy "completed" and new "done"
  const completedAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "done"
  );
  const declinedAppointments = appointments.filter((a) => a.status === "declined");
  const canceledAppointments = appointments.filter((a) => a.status === "canceled");

  const historyAppointments = [
    ...completedAppointments,
    ...declinedAppointments,
    ...canceledAppointments,
  ];

  // -------------------------
  // Render: status button area
  //   - For users: show status label and Cancel button when appropriate
  //   - For admin: show Approve/Decline (pending) and when approved show COMPLETE + FOLLOW-UP
  // -------------------------
  const renderStatusButton = (appt) => {
    // --- USERS ---
    if (role !== "admin") {
      const showCancelButton = appt.status === "pending" && activeTab === "Appointments";

      if (showCancelButton) {
        return (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={[styles.statusButton, { backgroundColor: "#f0ad4e", marginRight: 8 }]}>
              <Text style={styles.statusText}>PENDING</Text>
            </View>
            <TouchableOpacity
              onPress={() => openCancelModal(appt)}
              style={styles.cancelUserButton}
            >
              <Text style={styles.cancelUserText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // color mapping for user-visible labels
      const statusColor =
        appt.status === "approved" ? "#5bc0de" :
        appt.status === "done" || appt.status === "completed" ? "#5cb85c" :
        appt.status === "follow-up" ? "#FFA726" :
        appt.status === "declined" ? "#d9534f" :
        appt.status === "canceled" ? "#999" :
        "#f0ad4e";

      const label =
        appt.status === "canceled" ? "CANCELLED" :
        appt.status === "follow-up" ? "FOLLOW-UP" :
        appt.status === "done" || appt.status === "completed" ? "DONE" :
        appt.status?.toUpperCase?.() || "PENDING";

      return (
        <View style={[styles.statusButton, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{label}</Text>
        </View>
      );
    }

    // --- ADMIN UI ---
    // Pending: Approve + Decline
    if (appt.status === "pending") {
      return (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => updateAppointmentStatus(appt.id, "approved")}
            style={[styles.statusButton, { backgroundColor: "#5bc0de" }]}
          >
            <Text style={styles.statusText}>APPROVE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openDeclineModal(appt)}
            style={[styles.statusButton, { backgroundColor: "#d9534f" }]}
          >
            <Text style={styles.statusText}>DECLINE</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Approved: allow admin to COMPLETE (add meds) or schedule FOLLOW-UP
    if (appt.status === "approved") {
      return (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleComplete(appt)}
            style={[styles.statusButton, { backgroundColor: "#5bc0de" }]}
          >
            <Text style={styles.statusText}>COMPLETE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openFollowUpModal(appt)}
            style={[styles.statusButton, { backgroundColor: "#FFA726" }]}
          >
            <Text style={styles.statusText}>FOLLOW-UP</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // For other statuses (done/follow-up/etc.) show a non-clickable label
    const bg =
      appt.status === "done" || appt.status === "completed" ? "#5cb85c" :
      appt.status === "follow-up" ? "#FFA726" :
      appt.status === "declined" ? "#d9534f" :
      appt.status === "canceled" ? "#999" :
      "#777";

    const text =
      appt.status === "done" || appt.status === "completed" ? "DONE" :
      appt.status === "follow-up" ? "FOLLOW-UP" :
      appt.status === "declined" ? "DECLINED" :
      appt.status === "canceled" ? "CANCELLED" :
      appt.status?.toUpperCase?.() || "STATUS";

    return (
      <View style={[styles.statusButton, { backgroundColor: bg }]}>
        <Text style={styles.statusText}>{text}</Text>
      </View>
    );
  };

  // -------------------------
  // Render each appointment card (very similar to your original structure)
  // includes medication/follow-up display blocks
  // -------------------------
  const renderAppointment = (appt) => (
    <View key={appt.id} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{appt.petName || "Unnamed Pet"}</Text>

        <Text style={styles.details}>
          {appt.service || "Service"} • {appt.date || "No date"} • {appt.time || "No time"}
        </Text>

        {/* Medication box (for done/completed) */}
        {(appt.status === "done" || appt.status === "completed") && appt.medication && (
          <View style={styles.medsBox}>
            <Text style={styles.medsTitle}>Medication:</Text>
            <Text style={styles.medsItem}>{appt.medication.medicine} ({appt.medication.dosage})</Text>
            {appt.medication.duration ? <Text style={styles.medsItem}>{appt.medication.duration}</Text> : null}
            {appt.medication.notes ? <Text style={styles.medsItem}>{appt.medication.notes}</Text> : null}
            {appt.medication.savedAt ? <Text style={{ fontSize: 11, color: "#777", marginTop: 6 }}>Saved: {new Date(appt.medication.savedAt).toLocaleString()}</Text> : null}
          </View>
        )}

        {/* Follow-up box */}
        {appt.status === "follow-up" && (
          <View style={styles.noteBox}>
            <Text style={[styles.noteTitle, { color: "#BF6A00" }]}>Follow-up Scheduled</Text>
            {appt.followUpDate ? (
              // stored as ISO string
              <Text style={styles.noteText}>
                📅 {new Date(appt.followUpDate).toLocaleString()}
              </Text>
            ) : null}
            {appt.followUpNotes ? <Text style={styles.noteText}>📝 {appt.followUpNotes}</Text> : null}
          </View>
        )}

        {/* Decline notes / cancel notes (existing) */}
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
      </View>

      {/* right side action/status */}
      {renderStatusButton(appt)}
    </View>
  );

  // -------------------------
  // Render grouped content by active tab
  // -------------------------
  const renderContent = () => {
    if (activeTab === "Appointments") {
      const active = [...pendingAppointments, ...approvedAppointments];
      return active.length ? active.map(renderAppointment) : <Text style={styles.emptyText}>No active appointments</Text>;
    }

    if (activeTab === "Medication") {
      return completedAppointments.length ? completedAppointments.map(renderAppointment) : <Text style={styles.emptyText}>No medication records</Text>;
    }

    if (activeTab === "History") {
      return historyAppointments.length ? historyAppointments.map(renderAppointment) : <Text style={styles.emptyText}>No history yet</Text>;
    }
  };

  // -------------------------
  // JSX
  // -------------------------
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        {/* Tabs */}
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

        {/* Scrollable content area */}
        <ScrollView style={styles.scrollContainer}>{renderContent()}</ScrollView>

        {/* -----------------------
            ADMIN: Prescription Modal (COMPLETE -> add meds -> mark done)
           ----------------------- */}
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
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setPrescriptionModal(false);
                      setSelectedAppt(null);
                      setPrescription({ medicine: "", dosage: "", duration: "", notes: "" });
                    }}
                  >
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

        {/* -----------------------
            ADMIN: Follow-Up Modal
           ----------------------- */}
        {role === "admin" && (
          <Modal visible={followUpModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Schedule Follow-Up</Text>

                <Text style={{ marginBottom: 8, color: "#555" }}>Pick a date for follow-up:</Text>

                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: "#ddd",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                  onPress={() => {
                    // show native picker
                    setShowDatePicker(true);
                  }}
                >
                  <Text>
                    {followUpDate ? new Date(followUpDate).toLocaleString() : "Select date"}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={followUpDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "calendar"}
                    onChange={onChangeDate}
                  />
                )}

                <TextInput
                  placeholder="Notes for follow-up (optional)"
                  style={[styles.input, { height: 90 }]}
                  multiline
                  value={followUpNotes}
                  onChangeText={setFollowUpNotes}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setFollowUpModal(false);
                      setSelectedAppt(null);
                      setFollowUpNotes("");
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={{ color: "#555" }}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: "#FFA726" }]}
                    onPress={saveFollowUp}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Save Follow-Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* -----------------------
            USER: Cancel Modal
           ----------------------- */}
        <Modal visible={showCancelModal} transparent animationType="fade">
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
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCancelModal(false);
                    setSelectedAppt(null);
                    setCancelReason("");
                  }}
                >
                  <Text style={{ color: "#555" }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: "#d9534f" }]}
                  onPress={confirmCancel}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Confirm Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* -----------------------
            ADMIN: Decline Modal
           ----------------------- */}
        {role === "admin" && (
          <Modal visible={showDeclineModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Decline Appointment</Text>
                <Text style={{ marginBottom: 10, color: "#555" }}>Why are you declining?</Text>
                <TextInput
                  placeholder="Reason (required)"
                  style={[styles.input, { height: 80 }]}
                  multiline
                  value={declineReason}
                  onChangeText={setDeclineReason}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowDeclineModal(false);
                      setSelectedAppt(null);
                      setDeclineReason("");
                    }}
                  >
                    <Text style={{ color: "#555" }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: "#d9534f" }]}
                    onPress={confirmDecline}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Confirm Decline</Text>
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

// -------------------------
// Styles (kept long form to match your original look)
// -------------------------
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "85%", backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, marginBottom: 10 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  cancelButton: { padding: 10, marginRight: 10 },
  saveButton: { backgroundColor: "#00BFA6", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
});
