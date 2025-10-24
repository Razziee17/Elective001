import Ionicons from "@expo/vector-icons/Ionicons";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import uuid from "react-native-uuid";
import { useAppointments } from "../context/AppointmentContext";
import { useUser } from "../context/UserContext";
import { db } from "../firebase";

export default function AppointmentsScreen() {
  const appointmentsData = useAppointments();
  const userData = useUser();

  if (!appointmentsData || !userData) return <Text>Loading...</Text>;
  const { addAppointment, appointments, setAppointments } = appointmentsData;
  const { user } = userData;

  if (typeof setAppointments !== "function") {
    console.warn("⚠️ setAppointments not found in AppointmentContext. Please ensure context exports it.");
  }

  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState("");
  const [petName, setPetName] = useState("");
  const [petAge, setPetAge] = useState("");
  const [selectedBreed, setSelectedBreed] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false);

  // 🔄 Real-time Firestore sync (for this user)
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "appointments"), where("owner", "==", user.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      if (typeof setAppointments === "function") setAppointments(liveData);
    });
    return unsubscribe;
  }, [user?.email]);

  const services = [
    "Check-up",
    "Treatment",
    "Diagnostics",
    "Ultrasound",
    "X-ray",
    "Laser Therapy",
    "Major and Minor Surgery",
    "Vaccination",
    "Deworming",
    "Grooming",
    "Confinement",
  ];

  const animals = ["Dog", "Cat", "Rabbit", "Bird"];
  const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

  const breeds = {
    Dog: ["Shih Tzu", "Labrador", "Poodle", "Golden Retriever"],
    Cat: ["Persian", "Siamese", "Maine Coon", "Bengal"],
    Rabbit: ["Lionhead", "Netherland Dwarf", "Lop"],
    Bird: ["Parrot", "Canary", "Lovebird"],
  };

  const handleBookNow = async () => {
    if (!selectedAnimal || !petName || !selectedService || !selectedDate || !selectedTime) {
      Alert.alert("Error", "Please complete all fields before booking.");
      return;
    }

    const dateParts = selectedDate.split(" ");
    const monthMap = {
      January: "01", February: "02", March: "03", April: "04",
      May: "05", June: "06", July: "07", August: "08",
      September: "09", October: "10", November: "11", December: "12",
    };
    const monthNum = monthMap[dateParts[0]] || "01";
    const formattedDate = `${dateParts[2]}-${monthNum}-${dateParts[1]}`;
    const ageNum = petAge.match(/\d+/)?.[0] || "0";

    const newAppointment = {
      id: uuid.v4(),
      petName,
      animal: selectedAnimal,
      breed: selectedBreed,
      age: ageNum,
      service: selectedService,
      date: formattedDate,
      time: selectedTime,
      status: "pending",
      owner: user?.email || "anonymous",
      doctor: "",
      createdAt: serverTimestamp(),
      declineNotes: "",
      followUpDate: "",
      followUpNotes: "",
      medication: "",
    };

    try {
      const conflictQuery = query(
        collection(db, "appointments"),
        where("date", "==", formattedDate),
        where("time", "==", selectedTime)
      );
      const conflictSnapshot = await getDocs(conflictQuery);
      if (!conflictSnapshot.empty) {
        Alert.alert("Slot Unavailable", "This time slot has already been booked.");
        return;
      }

      await addDoc(collection(db, "appointments"), newAppointment);
      if (typeof addAppointment === "function") addAppointment(newAppointment);

      Alert.alert("Success", `Appointment booked for ${petName} on ${formattedDate} at ${selectedTime}.`);

      setSelectedAnimal("");
      setPetName("");
      setSelectedBreed("");
      setPetAge("");
      setSelectedService("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to book appointment.");
    }
  };

  const getAvailableSlots = () => {
    if (!selectedDate)
      return timeSlots.map((time) => ({ time, booked: false }));

    const dateParts = selectedDate.split(" ");
    const monthMap = {
      January: "01", February: "02", March: "03", April: "04",
      May: "05", June: "06", July: "07", August: "08",
      September: "09", October: "10", November: "11", December: "12",
    };
    const monthNum = monthMap[dateParts[0]] || "01";
    const formattedDate = `${dateParts[2]}-${monthNum}-${dateParts[1]}`;

    const bookedTimes = appointments
      .filter((a) => a.date === formattedDate)
      .map((a) => a.time);

    return timeSlots.map((time) => ({
      time,
      booked: bookedTimes.includes(time),
    }));
  };

  const availableSlots = getAvailableSlots();

  const handlePetAgeChange = (text) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric === "") {
      setPetAge("");
      return;
    }
    const age = parseInt(numeric);
    const suffix = age === 1 ? "year old" : "years old";
    setPetAge(`${age} ${suffix}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Book an Appointment</Text>

        {/* 🐶 Animal */}
        <Text style={styles.label}>Select Animal</Text>
        <View style={styles.animalRow}>
          {animals.map((animal) => (
            <TouchableOpacity
              key={animal}
              style={[
                styles.animalButton,
                selectedAnimal === animal && styles.animalButtonActive,
              ]}
              onPress={() => {
                setSelectedAnimal(animal);
                setSelectedBreed("");
              }}
            >
              <Text
                style={[
                  styles.animalButtonText,
                  selectedAnimal === animal && styles.animalButtonTextActive,
                ]}
              >
                {animal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🐾 Pet name */}
        <Text style={styles.label}>Pet Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your pet’s name"
          value={petName}
          onChangeText={(text) => setPetName(text)}
        />

        {/* 🧮 Age */}
        <Text style={styles.label}>Pet Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age (e.g., 2)"
          keyboardType="numeric"
          value={petAge}
          onChangeText={handlePetAgeChange}
        />

        {/* 🧬 Breed */}
        <Text style={styles.label}>Breed</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setBreedModalVisible(true)}
        >
          <Text style={{ color: selectedBreed ? "#333" : "#999" }}>
            {selectedBreed || "Choose breed"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {/* Breed modal */}
        <Modal visible={breedModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Breed</Text>
                <TouchableOpacity onPress={() => setBreedModalVisible(false)}>
                  <Ionicons name="close" size={26} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={breeds[selectedAnimal] || []}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.serviceOption}
                    onPress={() => {
                      setSelectedBreed(item);
                      setBreedModalVisible(false);
                    }}
                  >
                    <Text style={styles.serviceText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* 🩺 Service */}
        <Text style={styles.label}>Select Service</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setServiceModalVisible(true)}
        >
          <Text style={{ color: selectedService ? "#333" : "#999" }}>
            {selectedService || "Choose a service"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {/* Service modal */}
        <Modal visible={serviceModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Service</Text>
                <TouchableOpacity onPress={() => setServiceModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={services}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.serviceOption}
                    onPress={() => {
                      setSelectedService(item);
                      setServiceModalVisible(false);
                    }}
                  >
                    <Text style={styles.serviceText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* 📅 Date selection */}
        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={{ color: selectedDate ? "#333" : "#999" }}>
            {selectedDate || "Choose a date"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {/* Simple inline date picker modal */}
        <Modal visible={showCalendar} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Date</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Ionicons name="close" size={26} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerRow}>
                <FlatList
                  data={[
                    "January","February","March","April","May","June",
                    "July","August","September","October","November","December"
                  ]}
                  keyExtractor={(item) => item}
                  style={{ height: 150 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dateOption,
                        month === item && styles.selectedDateOption,
                      ]}
                      onPress={() => setMonth(item)}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          month === item && styles.selectedDateOptionText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <FlatList
                  data={Array.from({ length: 31 }, (_, i) => (i + 1).toString())}
                  keyExtractor={(item) => item}
                  style={{ height: 150 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dateOption,
                        day === item && styles.selectedDateOption,
                      ]}
                      onPress={() => setDay(item)}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          day === item && styles.selectedDateOptionText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <FlatList
                  data={Array.from({ length: 30 }, (_, i) => (2025 + i).toString())}
                  keyExtractor={(item) => item}
                  style={{ height: 150 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dateOption,
                        year === item && styles.selectedDateOption,
                      ]}
                      onPress={() => setYear(item)}
                    >
                      <Text
                        style={[
                          styles.dateOptionText,
                          year === item && styles.selectedDateOptionText,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  if (month && day && year) {
                    setSelectedDate(`${month} ${day} ${year}`);
                    setShowCalendar(false);
                  } else {
                    Alert.alert("Error", "Please select month, day, and year.");
                  }
                }}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ⏰ Time slots */}
        <Text style={styles.label}>Available Time Slots</Text>
        <View style={styles.timeSlots}>
          {availableSlots.map(({ time, booked }) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeButton,
                selectedTime === time && styles.timeButtonActive,
                booked && styles.timeButtonBooked,
              ]}
              onPress={() => !booked && setSelectedTime(time)}
              disabled={booked}
            >
              <Text
                style={[
                  styles.timeText,
                  selectedTime === time && styles.timeTextActive,
                  booked && styles.timeTextBooked,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
          <Text style={styles.bookText}>Book Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 20, marginTop: -15 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#00BFA6", marginBottom: 20, textAlign: "center" },
  label: { fontWeight: "bold", marginTop: 15, marginBottom: 5, color: "#333" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, fontSize: 15 },
  animalRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  animalButton: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  animalButtonActive: { backgroundColor: "#00BFA6", borderColor: "#00BFA6" },
  animalButtonText: { color: "#444" },
  animalButtonTextActive: { color: "#fff" },
  bookButton: { backgroundColor: "#00BFA6", borderRadius: 30, alignItems: "center", paddingVertical: 14, marginTop: 25, marginBottom: 30 },
  bookText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  dropdown: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, width: "90%", height: "70%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  serviceOption: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#f1f1f1" },
  serviceText: { fontSize: 16 },
  datePickerRow: { flexDirection: "row", justifyContent: "space-between" },
  dateOption: { padding: 10 },
  selectedDateOption: { backgroundColor: "#00BFA6", borderRadius: 10 },
  dateOptionText: { color: "#333" },
  selectedDateOptionText: { color: "#fff" },
  confirmButton: { backgroundColor: "#00BFA6", borderRadius: 10, padding: 12, marginTop: 10, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "bold" },
  timeSlots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeButton: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 },
  timeButtonActive: { backgroundColor: "#00BFA6", borderColor: "#00BFA6" },
  timeButtonBooked: { backgroundColor: "#ccc", borderColor: "#ccc" },
  timeText: { color: "#444" },
  timeTextActive: { color: "#fff" },
  timeTextBooked: { color: "#999" },
});
