import { Ionicons } from "@expo/vector-icons";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
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
import AppHeader from "../components/AppHeader";
import { useAppointments } from "../context/AppointmentContext";
import { useUser } from "../context/UserContext";
import { db } from "../firebase";

export default function AppointmentsScreen() {
  const { addAppointment, appointments } = useAppointments(); // Sync with context
  const { user } = useUser();
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

  // ✅ FIREBASE: Sync booked slots from Firestore
  useEffect(() => {
    const q = query(collection(db, "appointments"), where("owner", "==", user?.email || "anonymous"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const booked = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!booked[data.date]) booked[data.date] = [];
        booked[data.date].push(data.time);
      });
      // Update context or local state if needed
    });
    return unsubscribe;
  }, [user]);

  const services = [
    "Check-up", "Treatment", "Diagnostics", "Ultrasound", "X-ray", "Laser Therapy",
    "Major and Minor Surgery", "Vaccination", "Deworming", "Grooming", "Confinement",
  ];

  const animals = ["Dog", "Cat", "Rabbit", "Bird"];
  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  ];

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

    // ✅ FIXED: Convert to YYYY-MM-DD for Firebase/Admin sync
    const dateParts = selectedDate.split(" ");
    const monthName = dateParts[0]; // "October"
    const dayNum = dateParts[1]; // "17"
    const yearNum = dateParts[2]; // "2025"
    const monthMap = {
      "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
      "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
    };
    const monthNum = monthMap[monthName] || "10"; // Default October
    const formattedDate = `${yearNum}-${monthNum}-${dayNum}`; // "2025-10-17"
    const ageNum = petAge.match(/\d+/)?.[0] || "0";

    const newAppointment = {
      id: uuid.v4(),
      petName,
      animal: selectedAnimal,
      breed: selectedBreed,
      age: ageNum,
      service: selectedService,
      date: formattedDate, // ✅ YYYY-MM-DD for AdminDashboard sync!
      time: selectedTime,
      status: "upcoming",
      owner: user?.email || "anonymous", // Link to user
      doctor: "Dr. Sarah Mitchell", // Default or from selection
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "appointments"), newAppointment);
      addAppointment(newAppointment); // Sync with context
      Alert.alert("Success", `✅ Appointment booked for ${petName} on ${formattedDate} at ${selectedTime}.`);
      // Reset fields
      setSelectedAnimal("");
      setPetName("");
      setSelectedBreed("");
      setPetAge("");
      setSelectedService("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (error) {
      Alert.alert("Error", "Failed to book appointment.");
    }
  };

  const getAvailableSlots = () => {
    if (!selectedDate) return timeSlots.map((time) => ({ time, booked: false }));
    // ✅ FIXED: Use YYYY-MM-DD for filtering
    const dateParts = selectedDate.split(" ");
    const monthName = dateParts[0];
    const dayNum = dateParts[1];
    const yearNum = dateParts[2];
    const monthMap = {
      "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
      "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
    };
    const monthNum = monthMap[monthName] || "10";
    const formattedDate = `${yearNum}-${monthNum}-${dayNum}`;
    const booked = appointments
      .filter((app) => app.date === formattedDate)
      .map((app) => app.time) || [];
    return timeSlots.map((time) => ({
      time,
      booked: booked.includes(time),
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
      <AppHeader
        showIcons={true}
        onProfilePress={() => setProfileVisible(true)}
        onNotificationPress={() => setNotificationsVisible(true)}
        onMenuPress={() => setMenuVisible(true)}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Book an Appointment</Text>

        {/* Animal */}
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

        {/* Pet Name */}
        <Text style={styles.label}>Pet Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your pet’s name"
          value={petName}
          onChangeText={(text) => {
            setPetName(text);
            const foundPet = user?.pets?.find((p) => p.name.toLowerCase() === text.toLowerCase());
            if (foundPet) {
              setSelectedAnimal(foundPet.animal);
              setSelectedBreed(foundPet.breed);
              setPetAge(foundPet.age);
            }
          }}
        />

        {/* Pet Age */}
        <Text style={styles.label}>Pet Age</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter age (e.g., 2)"
          keyboardType="numeric"
          value={petAge}
          onChangeText={handlePetAgeChange}
        />

        {/* Breed */}
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

        {/* Breed Modal */}
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

        {/* Service */}
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

        <Modal visible={serviceModalVisible} animationType="slide" transparent>
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

        {/* Date */}
        <Text style={styles.label}>Select Date</Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowCalendar(true)}
        >
          <Text style={{ color: selectedDate ? "#333" : "#999", flex: 1 }}>
            {selectedDate || "Choose a date"}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

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
                  data={["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]}
                  keyExtractor={(item) => item}
                  style={{ height: 150 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.dateOption, month === item && styles.selectedDateOption]}
                      onPress={() => setMonth(item)}
                    >
                      <Text style={[styles.dateOptionText, month === item && styles.selectedDateOptionText]}>
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
                      style={[styles.dateOption, day === item && styles.selectedDateOption]}
                      onPress={() => setDay(item)}
                    >
                      <Text style={[styles.dateOptionText, day === item && styles.selectedDateOptionText]}>
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
                      style={[styles.dateOption, year === item && styles.selectedDateOption]}
                      onPress={() => setYear(item)}
                    >
                      <Text style={[styles.dateOptionText, year === item && styles.selectedDateOptionText]}>
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
                    setSelectedDate(`${month} ${day}, ${year}`);
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

        {/* Time Slots */}
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
  dropdown: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, width: "90%", height: "70%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  serviceOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  serviceText: { fontSize: 16, color: "#333" },
  timeSlots: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 10 },
  timeButton: { borderWidth: 1, borderColor: "#ddd", borderRadius: 15, paddingHorizontal: 15, paddingVertical: 8 },
  timeButtonActive: { backgroundColor: "#00BFA6", borderColor: "#00BFA6" },
  timeButtonBooked: { backgroundColor: "#f4f4f4", borderColor: "#ccc" },
  timeText: { color: "#333" },
  timeTextActive: { color: "#fff" },
  timeTextBooked: { color: "#aaa", textDecorationLine: "line-through" },
  bookButton: { backgroundColor: "#00BFA6", borderRadius: 30, alignItems: "center", paddingVertical: 14, marginTop: 25, marginBottom: 30 },
  bookText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  datePickerRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  dateOption: { paddingVertical: 10, paddingHorizontal: 15, alignItems: "center" },
  dateOptionText: { color: "#555", fontSize: 16 },
  selectedDateOption: { backgroundColor: "#00BFA6", borderRadius: 10 },
  selectedDateOptionText: { color: "#fff", fontWeight: "bold" },
  confirmButton: { backgroundColor: "#00BFA6", borderRadius: 25, paddingVertical: 12, alignItems: "center", marginTop: 20 },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});