import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { db } from "../firebase";

export default function AdminDashboard() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Appointments");
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // 2025-10-17
  const [markedDates, setMarkedDates] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [profile, setProfile] = useState({
    firstName: "Jane", lastName: "Doe", email: "jane.doe@vetplus.com", phone: "+1 234-567-8900",
    bio: "Veterinary clinic administrator with 10 years of experience.", department: "Administration",
    employeeID: "VPLUS-2015-001", joinDate: "06/01/2015",
  });
  const [editMode, setEditMode] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [petName, setPetName] = useState("");

  useEffect(() => {
    console.log("🔥 AdminDashboard: Starting Firebase listener...");
    fetchAppointments();
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(`🔥 Firebase: Got ${querySnapshot.size} docs (Subscription Active)`);
      const apps = [];
      const marks = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const cleanDate = data.date ? data.date.replace(/[,]/g, "").trim() : null; // Remove commas
        console.log(`📄 Doc ID: ${doc.id}, Clean Date: ${cleanDate}, Time: ${data.time}, Owner: ${data.owner}`);
        apps.push({ id: doc.id, ...data, date: cleanDate }); // Normalize date
        if (cleanDate) marks[cleanDate] = { marked: true, dotColor: "#00BFA6" };
      });
      console.log(`📅 Marked Dates:`, marks);
      setAppointments(apps);
      updateTimeSlots(apps);
    }, (error) => {
      console.error("❌ Firebase Error:", error);
    });
    return () => console.log("🔥 Unsubscribed from Firebase"); // Debug cleanup
  }, []);

  const fetchAppointments = async () => {
    console.log("🔄 Manual Refresh Triggered");
    const q = query(collection(db, "appointments"));
    const snapshot = await getDocs(q);
    const apps = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const cleanDate = data.date ? data.date.replace(/[,]/g, "").trim() : null;
      apps.push({ id: doc.id, ...data, date: cleanDate });
    });
    setAppointments(apps);
    updateTimeSlots(apps);
  };

  const updateTimeSlots = (apps) => {
    const dateApps = apps.filter((app) => app.date === selectedDate);
    console.log(`🕐 Slots for ${selectedDate}: ${dateApps.length} appointments`);
    const morning = dateApps.filter((app) => app.time && app.time.match(/^\d{1,2}:00 AM$/)).length;
    const afternoon = dateApps.filter((app) => app.time && app.time.match(/^\d{1,2}:00 PM$/)).length;
    const totalPerPeriod = 8;
    const newSlots = [
      { label: "Morning (8AM-12PM)", available: totalPerPeriod - morning, booked: morning },
      { label: "Afternoon (12PM-6PM)", available: totalPerPeriod - afternoon, booked: afternoon },
      { label: "Evening (6PM-8PM)", available: totalPerPeriod - (8 - morning - afternoon), booked: 0 },
    ];
    console.log("⏰ Time Slots:", newSlots);
    setTimeSlots(newSlots);
  };

  const onDayPress = (day) => {
    console.log(`📅 Selected Date: ${day.dateString}`);
    setSelectedDate(day.dateString);
    updateTimeSlots(appointments);
  };

  const bookAppointment = async (slot) => {
    if (!slot.available) {
      Alert.alert("No Slots", "No available slots in this period.");
      return;
    }
    setBookingModalVisible(true); // Show custom modal
  };

  const handleBook = async () => {
    if (!petName) {
      Alert.alert("Error", "Please enter a pet name.");
      return;
    }
    const time = slot.label.split(" ")[0] === "Morning" ? "9:00 AM" : slot.label.split(" ")[0] === "Afternoon" ? "2:00 PM" : "6:00 PM";
    try {
      const docRef = await addDoc(collection(db, "appointments"), {
        pet: petName, owner: "New Owner", time, date: selectedDate, service: "General Check-up",
        doctor: "Dr. Sarah Mitchell", status: "Booked", createdAt: serverTimestamp(),
      });
      console.log("✅ Admin Booked Doc ID:", docRef.id);
      Alert.alert("Success", "Appointment booked!");
      setBookingModalVisible(false);
      setPetName("");
      fetchAppointments(); // Force refresh
    } catch (error) {
      console.error("❌ Admin Book Error:", error);
      Alert.alert("Error", "Failed to book.");
    }
  };

  const handleSave = () => { setEditMode(false); Alert.alert("Profile saved!"); };
  const handleCancel = () => setEditMode(false);

  const todayAppointments = appointments.filter((app) => app.date === selectedDate);
  console.log(`👥 Today's Appts for ${selectedDate}:`, todayAppointments);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👑 ADMIN DASHBOARD</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === "Appointments" && styles.activeTab]} onPress={() => setActiveTab("Appointments")}>
          <Text style={[styles.tabText, activeTab === "Appointments" && styles.activeTabText]}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "Profile" && styles.activeTab]} onPress={() => setActiveTab("Profile")}>
          <Text style={[styles.tabText, activeTab === "Profile" && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === "Reports" && styles.activeTab]} onPress={() => setActiveTab("Reports")}>
          <Text style={[styles.tabText, activeTab === "Reports" && styles.activeTabText]}>Reports</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "Appointments" && (
          <View style={styles.appointmentsContainer}>
            <View style={styles.leftPanel}>
              <Text style={styles.sectionTitle}>Appointment Management</Text>
              <Text style={styles.subtitle}>Schedule and manage pet appointments</Text>
              <View style={styles.filterRow}>
                <Text style={styles.filterText}>Appointments for {selectedDate} ({todayAppointments.length} found)</Text>
                <TouchableOpacity style={styles.searchButton} onPress={fetchAppointments}>
                  <Ionicons name="refresh" size={20} color="#00BFA6" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.appointmentsList} showsVerticalScrollIndicator={false}>
                {todayAppointments.length === 0 ? (
                  <View><Text style={styles.noData}>No appointments for {selectedDate}. Check console logs!</Text></View>
                ) : (
                  todayAppointments.map((appt) => (
                    <View key={appt.id} style={styles.appointmentCard}>
                      <View style={styles.petIcon}><Ionicons name="paw-outline" size={20} color="#00BFA6" /></View>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentPet}>{appt.petName || appt.pet}</Text>
                        <Text style={styles.appointmentDetails}>{appt.time} - {appt.service} - {appt.doctor}</Text>
                        <Text style={styles.appointmentOwner}>Owner: {appt.owner}</Text>
                      </View>
                      <View style={[styles.status, getStatusStyle(appt.status)]}>
                        <Text style={styles.statusText}>{appt.status}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
            <View style={styles.rightPanel}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Calendar</Text>
                <TouchableOpacity><Text style={styles.calendarDropdown}>October 2025 ▼</Text></TouchableOpacity>
              </View>
              <Calendar onDayPress={onDayPress} markedDates={markedDates} current={selectedDate} style={styles.calendar} theme={{ selectedDayBackgroundColor: "#00BFA6", selectedDayTextColor: "#fff", todayTextColor: "#00BFA6", dotColor: "#00BFA6" }} />
              <Text style={styles.slotsTitle}>Time Slots Available</Text>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity key={index} style={[styles.slotCard, slot.available === 0 && styles.slotDisabled]} onPress={() => bookAppointment(slot)} disabled={slot.available === 0}>
                  <Text style={styles.slotLabel}>{slot.label}</Text>
                  <Text style={styles.slotAvailable}>{slot.available} slots available</Text>
                  <Text style={styles.slotBooked}>{slot.booked} booked</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === "Profile" && (
          <View>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {/* ... (same as before) */}
          </View>
        )}

        {activeTab === "Reports" && (
          <View>
            <Text style={styles.sectionTitle}>Reports</Text>
            {/* ... (same as before) */}
          </View>
        )}
      </ScrollView>

      {/* Custom Booking Modal */}
      <Modal visible={bookingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter pet name"
              value={petName}
              onChangeText={setPetName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setBookingModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleBook}>
                <Text style={styles.confirmText}>Book</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStatusStyle = (status) => {
  const base = styles.status;
  switch (status) {
    case "Confirmed": return [base, styles.confirmed];
    case "Pending": return [base, styles.pending];
    case "Canceled": return [base, styles.canceled];
    case "Booked": return [base, styles.booked];
    case "upcoming": return [base, styles.booked];
    default: return base;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#00BFA6", textAlign: "center", marginTop: 20, paddingHorizontal: 20 },
  tabContainer: { flexDirection: "row", justifyContent: "space-around", marginVertical: 20, borderBottomWidth: 1, borderBottomColor: "#E0F7F4" },
  tab: { paddingVertical: 10, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#00BFA6" },
  tabText: { fontSize: 16, color: "#666" },
  activeTabText: { fontSize: 16, fontWeight: "bold", color: "#00BFA6" },
  content: { flex: 1 },
  appointmentsContainer: { flex: 1, flexDirection: "row" },
  leftPanel: { flex: 1, padding: 20 },
  rightPanel: { flex: 1, padding: 20, borderLeftWidth: 1, borderLeftColor: "#E0F7F4" },
  filterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  filterText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  searchButton: { padding: 5 },
  appointmentsList: { maxHeight: 400 },
  appointmentCard: { flexDirection: "row", backgroundColor: "#E0F7F4", padding: 15, borderRadius: 10, marginBottom: 10, alignItems: "center" },
  petIcon: { marginRight: 10 },
  appointmentInfo: { flex: 1 },
  appointmentPet: { fontSize: 16, fontWeight: "bold" },
  appointmentDetails: { fontSize: 14, color: "#666" },
  appointmentOwner: { fontSize: 12, color: "#999" },
  status: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: 10 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  confirmed: { backgroundColor: "#E0F7F4", borderWidth: 1, borderColor: "#00BFA6" },
  pending: { backgroundColor: "#FFF3E0", borderWidth: 1, borderColor: "#FF9800" },
  canceled: { backgroundColor: "#FEEBE9", borderWidth: 1, borderColor: "#FF4C4C" },
  booked: { backgroundColor: "#E8F5E8", borderWidth: 1, borderColor: "#4CAF50" },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  calendarTitle: { fontSize: 16, fontWeight: "bold" },
  calendarDropdown: { fontSize: 14, color: "#00BFA6" },
  calendar: { height: 300, marginBottom: 20 },
  slotsTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  slotCard: { backgroundColor: "#E0F7F4", padding: 15, borderRadius: 10, marginBottom: 10 },
  slotDisabled: { backgroundColor: "#FEEBE9" },
  slotLabel: { fontSize: 14, fontWeight: "bold" },
  slotAvailable: { fontSize: 12, color: "#4CAF50" },
  slotBooked: { fontSize: 12, color: "#FF9800" },
  noData: { textAlign: "center", color: "#999", fontSize: 16, padding: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 10, width: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 5, padding: 10, marginBottom: 10 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  cancelButton: { backgroundColor: "#FF4C4C", padding: 10, borderRadius: 5, flex: 1, marginRight: 5 },
  cancelText: { color: "#fff", textAlign: "center" },
  confirmButton: { backgroundColor: "#00BFA6", padding: 10, borderRadius: 5, flex: 1, marginLeft: 5 },
  confirmText: { color: "#fff", textAlign: "center" },
});