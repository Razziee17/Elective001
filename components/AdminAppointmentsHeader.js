import DateTimePicker from "@react-native-community/datetimepicker";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
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

  // Modal visibility
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);

  const [currentAppt, setCurrentAppt] = useState(null);

  // Medication state
  const [medications, setMedications] = useState([
    { name: "", dosage: "", unit: "", interval: "", notes: "" },
  ]);

  // Decline/Follow-up
  const [declineNotes, setDeclineNotes] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Booking
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [petName, setPetName] = useState("");

  useEffect(() => {
    let unsubscribe;
    const init = async () => {
      try {
        await fetchAppointments();
        const q = query(collection(db, "appointments"));
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
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
            console.log("Appointments updated:", apps);
            setAppointments(apps);
            setMarkedDates(marks);
            updateTimeSlots(apps);
          },
          (err) => {
            console.error("Snapshot error:", err);
            Alert.alert("Error", "Failed to sync appointments.");
          }
        );
      } catch (err) {
        console.error("Init error:", err);
        Alert.alert("Error", "Failed to initialize appointments.");
      }
    };
    init();
    return () => unsubscribe && unsubscribe();
  }, []);

  const fetchAppointments = async () => {
    try {
      const q = query(collection(db, "appointments"));
      const snap = await getDocs(q);
      const apps = [];
      const marks = {};
      snap.forEach((d) => {
        const data = d.data();
        const cleanDate = data.date
          ? data.date.toString().replace(/[,/].*$/, "").trim()
          : null;
        apps.push({ id: d.id, ...data, date: cleanDate });
        if (cleanDate) marks[cleanDate] = { marked: true, dotColor: "#00BFA6" };
      });
      console.log("Fetched appointments:", apps);
      setAppointments(apps);
      setMarkedDates(marks);
      updateTimeSlots(apps);
    } catch (err) {
      console.error("fetchAppointments error:", err);
      Alert.alert("Error", "Failed to fetch appointments.");
    }
  };

  const updateTimeSlots = (apps) => {
    const dateApps = apps.filter((a) => a.date === selectedDate);
    const morning = dateApps.filter((app) => app.time?.match(/AM/)).length;
    const afternoon = dateApps.filter((app) => app.time?.match(/PM/)).length;
    const totalPerPeriod = 8;
    const newSlots = [
      { label: "Morning (8AM-12PM)", available: totalPerPeriod - morning },
      { label: "Afternoon (12PM-6PM)", available: totalPerPeriod - afternoon },
      { label: "Evening (6PM-8PM)", available: totalPerPeriod - (morning + afternoon) },
    ];
    setTimeSlots(newSlots);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    updateTimeSlots(appointments);
  };

  const todayAppointments = appointments.filter((app) => app.date === selectedDate);

  // Approve flow
  const openApproveFlow = (appt) => {
    if (!appointments.find((a) => a.id === appt.id)) {
      Alert.alert("Error", "This appointment is no longer available.");
      return;
    }
    setCurrentAppt(appt);
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    if (!currentAppt) {
      setApproveModalVisible(false);
      Alert.alert("Error", "No appointment selected.");
      return;
    }
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setApproveModalVisible(false);
        setCurrentAppt(null);
        Alert.alert("Error", "Appointment no longer exists.");
        return;
      }
      await updateDoc(docRef, {
        status: "approved",
        updatedAt: serverTimestamp(),
      });
      setApproveModalVisible(false);
      Alert.alert("Approved", "Appointment approved. Click Done to add medication.");
    } catch (err) {
      console.error("confirmApprove error:", err);
      Alert.alert("Error", `Failed to approve appointment: ${err.message}`);
    }
  };

  // Medication flow
  const openMedicationFromDone = (appt) => {
    if (!appointments.find((a) => a.id === appt.id)) {
      Alert.alert("Error", "This appointment is no longer available.");
      return;
    }
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
    if (!currentAppt) {
      setMedicationModalVisible(false);
      Alert.alert("Error", "No appointment selected.");
      return;
    }
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setMedicationModalVisible(false);
        setCurrentAppt(null);
        Alert.alert("Error", "Appointment no longer exists.");
        return;
      }
      const medsToSave = medications.filter((m) => m.name.trim() !== "");
      if (medsToSave.length === 0) {
        Alert.alert("Error", "Please add at least one medication with a name.");
        return;
      }
      const medsCol = collection(db, "appointments", currentAppt.id, "medications");
      for (const med of medsToSave) {
        await addDoc(medsCol, { ...med, createdAt: serverTimestamp() });
      }
      await updateDoc(docRef, {
        medicationAdded: true,
        updatedAt: serverTimestamp(),
      });
      setMedicationModalVisible(false);
      setCurrentAppt(null);
      setMedications([{ name: "", dosage: "", unit: "", interval: "", notes: "" }]);
      Alert.alert("Saved", "Medications recorded.");
    } catch (err) {
      console.error("saveMedications error:", err);
      Alert.alert("Error", `Failed to save medications: ${err.message}`);
    }
  };

  // Decline flow
  const openDeclineFlow = (appt) => {
    if (!appointments.find((a) => a.id === appt.id)) {
      Alert.alert("Error", "This appointment is no longer available.");
      return;
    }
    setCurrentAppt(appt);
    setDeclineNotes(appt.declineNotes || "");
    setDeclineModalVisible(true);
  };

  const confirmDecline = async () => {
    if (!currentAppt) {
      setDeclineModalVisible(false);
      Alert.alert("Error", "No appointment selected.");
      return;
    }
    if (!declineNotes.trim()) {
      Alert.alert("Error", "Please provide a reason for declining.");
      return;
    }
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setDeclineModalVisible(false);
        setCurrentAppt(null);
        Alert.alert("Error", "Appointment no longer exists.");
        return;
      }
      await updateDoc(docRef, {
        status: "declined",
        declineNotes,
        updatedAt: serverTimestamp(),
      });
      setDeclineModalVisible(false);
      setDeclineNotes("");
      setCurrentAppt(null);
      Alert.alert("Declined", "Appointment declined.");
    } catch (err) {
      console.error("confirmDecline error:", err);
      Alert.alert("Error", `Failed to decline appointment: ${err.message}`);
    }
  };

  // Follow-up flow
  const openFollowUpFlow = (appt) => {
    if (!appointments.find((a) => a.id === appt.id)) {
      Alert.alert("Error", "This appointment is no longer available.");
      return;
    }
    setCurrentAppt(appt);
    setFollowUpNotes(appt.followUpNotes || "");
    setFollowUpDate(appt.followUpDate ? new Date(appt.followUpDate) : new Date());
    setFollowUpModalVisible(true);
  };

  const confirmFollowUp = async () => {
    if (!currentAppt) {
      setFollowUpModalVisible(false);
      Alert.alert("Error", "No appointment selected.");
      return;
    }
    try {
      const docRef = doc(db, "appointments", currentAppt.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setFollowUpModalVisible(false);
        setCurrentAppt(null);
        Alert.alert("Error", "Appointment no longer exists.");
        return;
      }
      await updateDoc(docRef, {
        status: "followup",
        followUpDate: followUpDate.toISOString().split("T")[0],
        followUpNotes,
        updatedAt: serverTimestamp(),
      });
      setFollowUpModalVisible(false);
      setFollowUpNotes("");
      setFollowUpDate(new Date());
      setCurrentAppt(null);
      Alert.alert("Follow Up", `Follow-up set for ${followUpDate.toISOString().split("T")[0]}`);
    } catch (err) {
      console.error("confirmFollowUp error:", err);
      Alert.alert("Error", `Failed to schedule follow-up: ${err.message}`);
    }
  };

  // Date picker handlers for follow-up
  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);
  const handleConfirmDate = (event, selectedDate) => {
    if (selectedDate) {
      setFollowUpDate(selectedDate);
    }
    if (Platform.OS !== "ios") {
      hideDatePicker();
    }
  };

  // Booking modal logic
  const bookAppointment = async (slot) => {
    if (!slot.available) return Alert.alert("No slots");
    setBookingModalVisible(true);
  };

  const handleBook = async () => {
    if (!petName) return Alert.alert("Error", "Please enter a pet name.");
    try {
      await addDoc(collection(db, "appointments"), {
        pet: petName,
        owner: "New Owner",
        time: "9:00 AM",
        date: selectedDate,
        service: "General Check-up",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Booked", "Appointment added.");
      setBookingModalVisible(false);
      setPetName("");
      await fetchAppointments();
    } catch (error) {
      console.error("Book Error:", error);
      Alert.alert("Error", `Failed to book: ${error.message}`);
    }
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

                {appt.status === "declined" ? (
                  <Text style={styles.statusText}>Status: Declined</Text>
                ) : appt.status === "approved" ? (
                  <View style={styles.actionsRow}>
                    <Text style={styles.statusText}>Status: Approved</Text>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.doneBtn]}
                      onPress={() => openMedicationFromDone(appt)}
                      disabled={!appointments.find((a) => a.id === appt.id)}
                    >
                      <Text style={[styles.actionText, { color: "#fff" }]}>Done</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.followUpBtn]}
                      onPress={() => openFollowUpFlow(appt)}
                      disabled={!appointments.find((a) => a.id === appt.id)}
                    >
                      <Text style={styles.actionText}>Follow Up</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => openApproveFlow(appt)}
                      disabled={!appointments.find((a) => a.id === appt.id)}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.declineBtn]}
                      onPress={() => openDeclineFlow(appt)}
                      disabled={!appointments.find((a) => a.id === appt.id)}
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
          {timeSlots.map((slot, i) => (
            <TouchableOpacity
              key={i}
              style={styles.slotCard}
              onPress={() => bookAppointment(slot)}
            >
              <Text>{slot.label}</Text>
              <Text>{slot.available} slots available</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Approve Modal */}
      <Modal
        visible={approveModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setApproveModalVisible(false);
          setCurrentAppt(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Approve Appointment</Text>
            <Text style={styles.modalText}>
              Approve appointment for{" "}
              <Text style={{ fontWeight: "700" }}>
                {currentAppt?.petName || currentAppt?.pet || "this pet"}
              </Text>{" "}
              at {currentAppt?.time}
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setApproveModalVisible(false);
                  setCurrentAppt(null);
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmApprove}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Confirm Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Medication Modal */}
      <Modal
        visible={medicationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setMedicationModalVisible(false);
          setCurrentAppt(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>Add Medication</Text>
            <Text style={styles.modalText}>
              For: {currentAppt?.petName || currentAppt?.pet || "selected pet"}
            </Text>
            {medications.map((m, idx) => (
              <View key={idx} style={styles.medRow}>
                <TextInput
                  placeholder="Name"
                  value={m.name}
                  onChangeText={(t) => updateMedicineField(idx, "name", t)}
                  style={styles.input}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    placeholder="Dosage"
                    value={m.dosage}
                    onChangeText={(t) => updateMedicineField(idx, "dosage", t)}
                    style={[styles.input, { width: 110 }]}
                  />
                  <TextInput
                    placeholder="Unit (mg/ml)"
                    value={m.unit}
                    onChangeText={(t) => updateMedicineField(idx, "unit", t)}
                    style={[styles.input, { width: 100 }]}
                  />
                </View>
                <TextInput
                  placeholder="Interval (e.g., 8h)"
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
                <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                  <TouchableOpacity onPress={() => removeMedicineRow(idx)}>
                    <Text style={{ color: "#FF4C4C", marginTop: 6 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.divider} />
              </View>
            ))}
            <TouchableOpacity onPress={addMedicineRow} style={{ marginVertical: 8 }}>
              <Text style={{ color: "#00BFA6" }}>+ Add another medicine</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setMedicationModalVisible(false);
                  setCurrentAppt(null);
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={saveMedications}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Decline Modal */}
      <Modal
        visible={declineModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setDeclineModalVisible(false);
          setCurrentAppt(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Decline Appointment</Text>
            <Text style={styles.modalText}>
              Add a note explaining why you're declining.
            </Text>
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
                onPress={() => {
                  setDeclineModalVisible(false);
                  setCurrentAppt(null);
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmDecline}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        visible={followUpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setFollowUpModalVisible(false);
          setCurrentAppt(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule Follow Up</Text>
            <TouchableOpacity onPress={showDatePicker} style={{ marginBottom: 12 }}>
              <Text style={{ color: "#00BFA6" }}>
                Select Date: {followUpDate.toISOString().split("T")[0]}
              </Text>
            </TouchableOpacity>
            {isDatePickerVisible && (
              <DateTimePicker
                value={followUpDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleConfirmDate}
              />
            )}
            <TextInput
              placeholder="Notes for follow up"
              value={followUpNotes}
              onChangeText={setFollowUpNotes}
              style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setFollowUpModalVisible(false);
                  setCurrentAppt(null);
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={confirmFollowUp}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Booking Modal */}
      <Modal
        visible={bookingModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setBookingModalVisible(false);
          setCurrentAppt(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TextInput
              placeholder="Pet name"
              value={petName}
              onChangeText={setPetName}
              style={styles.input}
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => {
                  setBookingModalVisible(false);
                  setCurrentAppt(null);
                }}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={handleBook}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  actionText: { color: "#00BFA6", fontWeight: "600" },
  noData: { textAlign: "center", color: "#999", fontSize: 16, padding: 20 },
  slotCard: {
    backgroundColor: "#E0F7F4",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  modalText: { color: "#555", marginBottom: 12 },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: "#f2f2f2",
  },
  modalConfirm: {
    backgroundColor: "#00BFA6",
  },
  modalBtnText: { color: "#333", fontWeight: "600" },
  medRow: { marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  statusText: { color: "#333", fontSize: 14, marginTop: 8 },
});