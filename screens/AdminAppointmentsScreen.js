import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { TextInput } from "react-native-web";
import { db } from "../firebase";

export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [markedDates, setMarkedDates] = useState({});
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [currentAppt, setCurrentAppt] = useState(null);

  // Date Picker
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirmDate = (event, selectedDate) => {
    if (selectedDate) setFollowUpDate(selectedDate);
    hideDatePicker();
  };

  // Modals
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);

  // Notes & Medications
  const [declineNotes, setDeclineNotes] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [medications, setMedications] = useState([
    { name: "", dosage: "", unit: "", interval: "", notes: "" },
  ]);

  // 🔥 Real-time listener
  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      where("status", "==", selectedStatus)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        const marks = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const dateKey = data.date
            ? data.date.toString().replace(/[,/].*$/, "").trim()
            : null;
          list.push({ id: docSnap.id, ...data, date: dateKey });
          if (dateKey) marks[dateKey] = { marked: true, dotColor: "#00BFA6" };
        });
        setAppointments(list);
        setMarkedDates(marks);
      },
      (err) => {
        console.error("Realtime listener error:", err);
        Alert.alert("Error", "Failed to sync appointments.");
      }
    );
    return () => unsubscribe();
  }, [selectedStatus]);

  const onDayPress = (day) => setSelectedDate(day.dateString);
  const todayAppointments = appointments.filter(
    (app) => app.date === selectedDate
  );

    // ✅ Approve
  const openApproveFlow = (appt) => {
    console.log("Opening approve flow for:", appt?.id);
    setCurrentAppt(appt);
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    // 🧠 Safety check to prevent invalid document paths
    if (!currentAppt?.id) {
      Alert.alert("Error", "Invalid appointment ID. Please try again.");
      console.error("❌ confirmApprove called with missing ID:", currentAppt);
      return;
    }

    console.log("Approving appointment:", currentAppt.id);

    try {
      const ref = doc(db, "appointments", currentAppt.id);
      await updateDoc(ref, {
        status: "approved",
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Successfully approved:", currentAppt.id);
      setApproveModalVisible(false);
      Alert.alert("Approved", "Appointment approved successfully.");
    } catch (err) {
      console.error("🔥 Error approving appointment:", err);
      Alert.alert("Error", err.message || "Failed to approve appointment.");
    }
  };


      // ❌ Decline
      const openDeclineFlow = (appt) => {
        setCurrentAppt(appt);
        setDeclineNotes(appt.declineNotes || "");
        setDeclineModalVisible(true);
      };
      const confirmDecline = async () => {
      if (!currentAppt?.id) {
        Alert.alert("Error", "Invalid appointment ID.");
        return;
      }
      if (!declineNotes.trim()) return Alert.alert("Error", "Enter a reason.");
      try {
        const ref = doc(db, "appointments", currentAppt.id);
        await updateDoc(ref, {
          status: "declined",
          declineNotes,
          updatedAt: serverTimestamp(),
        });
        setDeclineModalVisible(false);
        Alert.alert("Declined", "Appointment declined.");
      } catch (err) {
        console.error("🔥 Error declining appointment:", err);
        Alert.alert("Error", err.message);
      }
    };

    const confirmFollowUp = async () => {
      if (!currentAppt?.id) {
        Alert.alert("Error", "Invalid appointment ID.");
        return;
      }
      try {
        const ref = doc(db, "appointments", currentAppt.id);
        await updateDoc(ref, {
          status: "followup",
          followUpNotes,
          followUpDate: followUpDate.toISOString().split("T")[0],
          updatedAt: serverTimestamp(),
        });
        setFollowUpModalVisible(false);
        Alert.alert("Follow Up", "Follow-up scheduled.");
      } catch (err) {
        console.error("🔥 Error setting follow-up:", err);
        Alert.alert("Error", err.message);
      }
    };


  // 💊 Medication Logic
  const openMedicationFromDone = (appt) => {
    setCurrentAppt(appt);
    setMedications([{ name: "", dosage: "", unit: "", interval: "", notes: "" }]);
    setMedicationModalVisible(true);
  };
  const addMedicineRow = () =>
    setMedications((prev) => [
      ...prev,
      { name: "", dosage: "", unit: "", interval: "", notes: "" },
    ]);
  const updateMedicineField = (idx, field, val) =>
    setMedications((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );
  const removeMedicineRow = (idx) =>
    setMedications((prev) => prev.filter((_, i) => i !== idx));
  const saveMedications = async () => {
    if (!currentAppt) return;
    try {
      const medsCol = collection(db, "appointments", currentAppt.id, "medications");
      for (const med of medications.filter((m) => m.name.trim())) {
        await addDoc(medsCol, { ...med, createdAt: serverTimestamp() });
      }
      const ref = doc(db, "appointments", currentAppt.id);
      await updateDoc(ref, { medicationAdded: true, updatedAt: serverTimestamp() });
      setMedicationModalVisible(false);
      Alert.alert("Saved", "Medications added.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* 🔘 Filter Buttons */}
      <View style={styles.filterBar}>
        {["pending", "approved", "declined", "followup"].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.filterButtonActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🗓 Calendar + Appointments */}
      <View style={styles.appointmentsContainer}>
        <View style={styles.leftPanel}>
          <Text style={styles.sectionTitle}>Appointments for {selectedDate}</Text>
          {todayAppointments.length === 0 ? (
            <Text style={styles.noData}>No appointments today.</Text>
          ) : (
            todayAppointments.map((appt) => (
              <View key={appt.id} style={styles.appointmentCard}>
                <Text style={styles.appointmentPet}>
                  {appt.petName || appt.pet || "Unnamed Pet"}
                </Text>
                <Text style={styles.appointmentDetails}>{appt.time}</Text>
                <Text style={styles.appointmentOwner}>Owner: {appt.owner}</Text>

                {appt.status === "approved" ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtnSmall, styles.doneBtn]}
                      onPress={() => openMedicationFromDone(appt)}
                    >
                      <Text style={[styles.actionText, { color: "#fff" }]}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtnSmall, styles.followUpBtn]}
                      onPress={() => openFollowUpFlow(appt)}
                    >
                      <Text style={styles.actionText}>Follow Up</Text>
                    </TouchableOpacity>
                  </View>
                ) : appt.status === "declined" ? (
                  <Text style={styles.statusText}>Declined</Text>
                ) : (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnSmall}
                      onPress={() => openApproveFlow(appt)}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtnSmall, styles.declineBtn]}
                      onPress={() => openDeclineFlow(appt)}
                    >
                      <Text style={styles.actionText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.rightPanel}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            current={selectedDate}
          />
        </View>
      </View>

      {/* ✅ Approve Modal */}
      <Modal visible={approveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Approve Appointment</Text>
            <Text>
              Approve appointment for {currentAppt?.petName || "this pet"} at{" "}
              {currentAppt?.time}?
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setApproveModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
                onPress={confirmApprove}
              >
                <Text style={{ color: "#fff" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 💊 Medication Modal */}
      <Modal visible={medicationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            {medications.map((m, idx) => (
              <View key={idx} style={styles.medRow}>
                <TextInput
                  placeholder="Medicine name"
                  value={m.name}
                  onChangeText={(t) => updateMedicineField(idx, "name", t)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Dosage"
                  value={m.dosage}
                  onChangeText={(t) => updateMedicineField(idx, "dosage", t)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Unit (mg/ml)"
                  value={m.unit}
                  onChangeText={(t) => updateMedicineField(idx, "unit", t)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Interval"
                  value={m.interval}
                  onChangeText={(t) => updateMedicineField(idx, "interval", t)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Notes"
                  value={m.notes}
                  onChangeText={(t) => updateMedicineField(idx, "notes", t)}
                  style={styles.input}
                  multiline
                />
                <TouchableOpacity onPress={() => removeMedicineRow(idx)}>
                  <Text style={{ color: "red", marginBottom: 8 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addMedicineRow}>
              <Text style={{ color: "#00BFA6" }}>+ Add another</Text>
            </TouchableOpacity>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setMedicationModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={saveMedications}>
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  filterBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#E0F7F4",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  filterButton: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  filterButtonActive: { backgroundColor: "#00BFA6" },
  filterText: { color: "#00BFA6", fontWeight: "600", fontSize: 13 },
  filterTextActive: { color: "#fff" },
  appointmentsContainer: { flexDirection: "row", flex: 1 },
  leftPanel: { flex: 1, padding: 15 },
  rightPanel: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  appointmentCard: {
    backgroundColor: "#E0F7F4",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  appointmentPet: { fontSize: 16, fontWeight: "bold" },
  appointmentDetails: { color: "#555" },
  appointmentOwner: { color: "#777", marginBottom: 10 },
  actionsRow: { flexDirection: "row", gap: 6, marginTop: 8 },
  actionBtnSmall: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#00BFA6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doneBtn: { backgroundColor: "#00BFA6" },
  followUpBtn: { borderColor: "#FFA726" },
  declineBtn: { borderColor: "#FF4C4C" },
  actionText: { color: "#00BFA6", fontSize: 13, fontWeight: "600" },
  noData: { textAlign: "center", color: "#999", fontSize: 15, padding: 20 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 10 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 8,
  },
  modalCancel: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  modalConfirm: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#00BFA6",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  medRow: { marginBottom: 8 },
});
