import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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
import { Calendar } from "react-native-calendars";
import { db } from "../firebase";

export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [markedDates, setMarkedDates] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);

  // Modals
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);

  const [currentAppt, setCurrentAppt] = useState(null);

  // Medication
  const [medications, setMedications] = useState([
    { name: "", dosage: "", unit: "", interval: "", notes: "" },
  ]);

  // Decline & Follow-Up
  const [declineNotes, setDeclineNotes] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // 🔄 LIVE SYNC FROM FIRESTORE
  useEffect(() => {
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = [];
      const marks = {};
      snapshot.forEach((d) => {
        const data = d.data();
        const cleanDate = data.date
          ? data.date.toString().replace(/[,/].*$/, "").trim()
          : null;
        apps.push({ id: d.id, ...data, date: cleanDate });
        if (cleanDate) marks[cleanDate] = { marked: true, dotColor: "#00BFA6" };
      });
      setAppointments(apps);
      setMarkedDates(marks);
      updateTimeSlots(apps);
    });
    return () => unsubscribe();
  }, []);

  const updateTimeSlots = (apps) => {
    const dateApps = apps.filter((a) => a.date === selectedDate);
    const morning = dateApps.filter((app) => app.time?.match(/AM/)).length;
    const afternoon = dateApps.filter((app) => app.time?.match(/PM/)).length;
    const totalPerPeriod = 8;
    const newSlots = [
      { label: "Morning (8AM-12PM)", available: totalPerPeriod - morning },
      { label: "Afternoon (12PM-6PM)", available: totalPerPeriod - afternoon },
    ];
    setTimeSlots(newSlots);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    updateTimeSlots(appointments);
  };

  const todayAppointments = appointments.filter(
    (app) => app.date === selectedDate
  );

  // ✅ APPROVE FLOW
  const openApproveFlow = (appt) => {
    setCurrentAppt(appt);
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!currentAppt) return;
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      await updateDoc(docRef, {
        status: "approved",
        updatedAt: serverTimestamp(),
      });
      setApproveModalVisible(false);
      Alert.alert("Approved", "Appointment approved successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ✅ MEDICATION FLOW
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

  const removeMedicineRow = (idx) =>
    setMedications((prev) => prev.filter((_, i) => i !== idx));

  const updateMedicineField = (idx, field, val) =>
    setMedications((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: val } : m))
    );

  const saveMedications = async () => {
    if (!currentAppt) return;
    try {
      const medsToSave = medications.filter((m) => m.name.trim() !== "");
      if (medsToSave.length === 0)
        return Alert.alert("Error", "Please add at least one medication.");

      const docRef = doc(db, "appointments", currentAppt.id);
      await updateDoc(docRef, {
        status: "completed",
        medication: medsToSave,
        updatedAt: serverTimestamp(),
      });

      setMedicationModalVisible(false);
      setMedications([{ name: "", dosage: "", unit: "", interval: "", notes: "" }]);
      setCurrentAppt(null);
      Alert.alert("Saved", "Medications recorded successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ✅ DECLINE FLOW
  const openDeclineFlow = (appt) => {
    setCurrentAppt(appt);
    setDeclineNotes("");
    setDeclineModalVisible(true);
  };

  const confirmDecline = async () => {
    if (!currentAppt) return;
    if (!declineNotes.trim())
      return Alert.alert("Error", "Please provide a reason for declining.");
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      await updateDoc(docRef, {
        status: "declined",
        declineNotes: declineNotes.trim(),
        updatedAt: serverTimestamp(),
      });
      setDeclineModalVisible(false);
      setCurrentAppt(null);
      Alert.alert("Declined", "Appointment declined successfully.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ✅ FOLLOW-UP FLOW
  const openFollowUpFlow = (appt) => {
    setCurrentAppt(appt);
    setFollowUpNotes("");
    setFollowUpModalVisible(true);
  };

  const confirmFollowUp = async () => {
    if (!currentAppt) return;
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      await updateDoc(docRef, {
        status: "followup",
        followUpDate: followUpDate.toISOString().split("T")[0],
        followUpNotes,
        updatedAt: serverTimestamp(),
      });
      setFollowUpModalVisible(false);
      setCurrentAppt(null);
      Alert.alert(
        "Follow-Up Set",
        `Follow-up scheduled for ${followUpDate.toISOString().split("T")[0]}`
      );
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirmDate = (event, selected) => {
    if (selected) setFollowUpDate(selected);
    if (Platform.OS !== "ios") hideDatePicker();
  };

  return (
    <ScrollView style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.logo}>VetPlus | Animal Clinic</Text>
      </View>

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

                {/* STATUS LOGIC */}
                {appt.status === "declined" ? (
                  <Text style={styles.statusText}>❌ Declined</Text>
                ) : appt.status === "approved" ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.doneBtn]}
                      onPress={() => openMedicationFromDone(appt)}
                    >
                      <Text style={[styles.actionText, { color: "#fff" }]}>
                        Done
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.followUpBtn]}
                      onPress={() => openFollowUpFlow(appt)}
                    >
                      <Text style={styles.actionText}>Follow Up</Text>
                    </TouchableOpacity>
                  </View>
                ) : appt.status === "completed" ? (
                  <Text style={styles.statusText}>✅ Completed (Medication Added)</Text>
                ) : appt.status === "followup" ? (
                  <Text style={styles.statusText}>📅 Follow-up Scheduled</Text>
                ) : (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openApproveFlow(appt)}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
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

      {/* ✅ APPROVE MODAL */}
      <Modal visible={approveModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Approve Appointment</Text>
            <Text style={styles.modalText}>
              Approve {currentAppt?.petName}'s appointment at {currentAppt?.time}?
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setApproveModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmApprove}
              >
                <Text style={{ color: "#fff" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ DECLINE MODAL */}
      <Modal visible={declineModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Decline Appointment</Text>
            <TextInput
              placeholder="Reason / notes"
              value={declineNotes}
              onChangeText={setDeclineNotes}
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setDeclineModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmDecline}
              >
                <Text style={{ color: "#fff" }}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ FOLLOW-UP MODAL */}
      <Modal visible={followUpModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Follow-Up</Text>
            <TouchableOpacity onPress={showDatePicker}>
              <Text style={{ color: "#00BFA6", marginBottom: 10 }}>
                {followUpDate.toISOString().split("T")[0]}
              </Text>
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                value={followUpDate}
                mode="date"
                display="default"
                onChange={handleConfirmDate}
              />
            )}
            <TextInput
              placeholder="Notes"
              value={followUpNotes}
              onChangeText={setFollowUpNotes}
              style={[styles.input, { minHeight: 80 }]}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setFollowUpModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmFollowUp}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ MEDICATION MODAL */}
      <Modal visible={medicationModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            {medications.map((m, idx) => (
              <View key={idx} style={styles.medRow}>
                <TextInput
                  placeholder="Name"
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
                  placeholder="Interval (e.g. 8h)"
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
                {idx > 0 && (
                  <TouchableOpacity onPress={() => removeMedicineRow(idx)}>
                    <Text style={{ color: "red" }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={addMedicineRow}>
              <Text style={{ color: "#00BFA6" }}>+ Add another medicine</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setMedicationModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={saveMedications}
              >
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
  content: { flex: 1 },
  header: {
    padding: 15,
    backgroundColor: "#E0F7F4",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  logo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00BFA6",
    textAlign: "center",
  },
  appointmentsContainer: { flex: 1, flexDirection: "row" },
  leftPanel: { flex: 1, padding: 20 },
  rightPanel: { flex: 1, padding: 20 },
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
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" },
  actionBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#00BFA6",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  declineBtn: { borderColor: "#FF4C4C" },
  followUpBtn: { borderColor: "#FFA726" },
  doneBtn: { backgroundColor: "#00BFA6", borderColor: "#00BFA6" },
  actionText: { fontWeight: "500" },
  statusText: { color: "#555", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#00BFA6",
  },
  modalText: { color: "#333", marginBottom: 10 },
  modalBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  modalCancel: { backgroundColor: "#f2f2f2" },
  modalConfirm: { backgroundColor: "#00BFA6" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  medRow: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
});
