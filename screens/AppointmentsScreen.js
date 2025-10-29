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
import { useEffect, useState, useRef } from "react";
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
  TouchableWithoutFeedback,
} from "react-native";
import uuid from "react-native-uuid";
import { useAppointments } from "../context/AppointmentContext";
import { useUser } from "../context/UserContext";
import { db, auth } from "../firebase";

export default function AppointmentsScreen() {
  const appointmentsData = useAppointments();
  const userData = useUser();

  if (!appointmentsData || !userData) return <Text>Loading...</Text>;
  const { addAppointment, appointments, setAppointments } = appointmentsData;
  const { user } = userData;

  if (typeof setAppointments !== "function") {
    console.warn("setAppointments not found in AppointmentContext.");
  }

  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState("");
  const [petName, setPetName] = useState("");
  const [petAgeRaw, setPetAgeRaw] = useState("");     // Raw number
  const [petAge, setPetAge] = useState("");           // Display text
  const [petAgeUnit, setPetAgeUnit] = useState("years"); // "years" or "months"
  const [selectedBreed, setSelectedBreed] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // "January 15 2025"
  const [selectedTime, setSelectedTime] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [breedModalVisible, setBreedModalVisible] = useState(false);

  // === Pet Auto-Fill ===
  const [myPets, setMyPets] = useState([]);
  const [petSuggestions, setPetSuggestions] = useState([]);
  const [showPetDropdown, setShowPetDropdown] = useState(false);
  const petInputRef = useRef(null);

  // === Calendar State ===
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date().getMonth()); // 0-11
  const [currentCalendarYear, setCurrentCalendarYear] = useState(new Date().getFullYear());

  // Fetch user's saved pets
  useEffect(() => {
    const loadMyPets = async () => {
      if (!auth.currentUser?.uid) return;
      try {
        const q = query(
          collection(db, "pets"),
          where("userId", "==", auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        const pets = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMyPets(pets);
      } catch (e) {
        console.error("Failed to load pets:", e);
      }
    };
    loadMyPets();
  }, [user?.email]);

  // Filter pet suggestions
  const onPetNameChange = (text) => {
    setPetName(text);
    if (!text.trim()) {
      setPetSuggestions([]);
      setShowPetDropdown(false);
      return;
    }
    const filtered = myPets.filter((p) =>
      p.name.toLowerCase().includes(text.toLowerCase())
    );
    setPetSuggestions(filtered);
    setShowPetDropdown(filtered.length > 0);
  };

  // === FIXED: selectPetSuggestion now preserves ageUnit from Firestore ===
  const selectPetSuggestion = async (pet) => {
    setPetName(pet.name);
    setSelectedAnimal(pet.categories);
    setSelectedBreed(pet.breed);

    const ageNum = Number(pet.age);
    const unit = pet.ageUnit === "months" ? "months" : "years"; // Preserve stored unit
    setPetAgeUnit(unit);
    setPetAgeRaw(ageNum.toString());

    const unitText = ageNum === 1
      ? (unit === "years" ? "year old" : "month old")
      : (unit === "years" ? "years old" : "months old");
    setPetAge(`${ageNum} ${unitText}`);

    setShowPetDropdown(false);
    setBreedModalVisible(true);
    setTimeout(() => setBreedModalVisible(false), 100);
  };

  // Real-time appointments
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
    "Check-up", "Treatment", "Diagnostics", "Ultrasound", "X-ray",
    "Laser Therapy", "Major and Minor Surgery", "Vaccination",
    "Deworming", "Grooming", "Confinement",
  ];

  const animals = ["Dog", "Cat", "Rabbit", "Bird"];
  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const breeds = {
    Dog: ["Labrador", "German Shepherd", "Bulldog", "Beagle"],
    Cat: ["Persian", "Siamese", "Maine Coon", "Tabby"],
    Rabbit: ["Dutch", "Lop", "Rex", "Mini Lop"],
    Bird: ["Parrot", "Canary", "Cockatiel", "Finch"],
  };

  // === CALENDAR LOGIC ===
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay(); // 0 = Sunday
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentCalendarMonth, currentCalendarYear);
    const firstDay = getFirstDayOfMonth(currentCalendarMonth, currentCalendarYear);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = [];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: null });
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentCalendarYear, currentCalendarMonth, day);
      const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isSelected = selectedDate === `${monthNames[currentCalendarMonth]} ${day} ${currentCalendarYear}`;

      days.push({
        day,
        dateStr,
        isPast,
        isToday,
        isSelected,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleDateSelect = (dayObj) => {
    if (!dayObj.day || dayObj.isPast) return;

    const selectedMonthName = monthNames[currentCalendarMonth];
    const fullDate = `${selectedMonthName} ${dayObj.day} ${currentCalendarYear}`;
    setSelectedDate(fullDate);
    setShowCalendar(false);
  };

  const goToPrevMonth = () => {
    if (currentCalendarMonth === 0) {
      setCurrentCalendarMonth(11);
      setCurrentCalendarYear(currentCalendarYear - 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentCalendarMonth === 11) {
      setCurrentCalendarMonth(0);
      setCurrentCalendarYear(currentCalendarYear + 1);
    } else {
      setCurrentCalendarMonth(currentCalendarMonth + 1);
    }
  };

  // === BOOKING ===
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
    const formattedDate = `${dateParts[2]}-${monthNum}-${dateParts[1].padStart(2, "0")}`;
    const ageNum = petAgeRaw ? parseInt(petAgeRaw, 10) : 0;

    const newAppointment = {
      id: uuid.v4(),
      petName,
      animal: selectedAnimal,
      breed: selectedBreed,
      age: ageNum,
      ageUnit: petAgeUnit, // Already correct — saved as "years" or "months"
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

      // Reset form
      setSelectedAnimal("");
      setPetName("");
      setSelectedBreed("");
      setPetAge("");
      setPetAgeRaw("");
      setPetAgeUnit("years");
      setSelectedService("");
      setSelectedDate("");
      setSelectedTime("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to book appointment.");
    }
  };

  const getAvailableSlots = () => {
    if (!selectedDate) return timeSlots.map((time) => ({ time, booked: false }));

    const dateParts = selectedDate.split(" ");
    const monthMap = {
      January: "01", February: "02", March: "03", April: "04",
      May: "05", June: "06", July: "07", August: "08",
      September: "09", October: "10", November: "11", December: "12",
    };
    const monthNum = monthMap[dateParts[0]] || "01";
    const formattedDate = `${dateParts[2]}-${monthNum}-${dateParts[1].padStart(2, "0")}`;

    const bookedTimes = appointments
      .filter((a) => a.date === formattedDate)
      .map((a) => a.time);

    return timeSlots.map((time) => ({
      time,
      booked: bookedTimes.includes(time),
    }));
  };

  const availableSlots = getAvailableSlots();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <TouchableWithoutFeedback onPress={() => setShowPetDropdown(false)}>
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

          {/* Pet Name + Auto-Fill Dropdown */}
          <Text style={styles.label}>Pet Name</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              ref={petInputRef}
              style={styles.input}
              placeholder="Enter your pet’s name"
              value={petName}
              onChangeText={onPetNameChange}
              onFocus={() => petName && setShowPetDropdown(petSuggestions.length > 0)}
            />

            {showPetDropdown && (
              <View style={styles.petDropdown}>
                {petSuggestions.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.petSuggestionItem}
                    onPress={() => selectPetSuggestion(pet)}
                  >
                    <Text style={styles.petSuggestionText}>{pet.name}</Text>
                    <Text style={styles.petSuggestionSub}>
                      {pet.categories} • {pet.breed} • {pet.age} {pet.ageUnit === "months" ? "mo" : "yr"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Pet Age - Years or Months */}
          <Text style={styles.label}>Pet Age</Text>
          <View style={styles.ageContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="e.g., 3"
              keyboardType="numeric"
              value={petAgeRaw}
              onChangeText={(text) => {
                const numeric = text.replace(/[^0-9]/g, "");
                if (!numeric) {
                  setPetAgeRaw("");
                  setPetAge("");
                  return;
                }
                let age = parseInt(numeric, 10);
                if (age < 0) age = 0;
                if (age > 99) age = 99;
                setPetAgeRaw(age.toString());

                const unitText = age === 1
                  ? (petAgeUnit === "years" ? "year old" : "month old")
                  : (petAgeUnit === "years" ? "years old" : "months old");
                setPetAge(`${age} ${unitText}`);
              }}
            />
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  petAgeUnit !== "months" && styles.unitButtonActive,
                ]}
                onPress={() => {
                  setPetAgeUnit("years");
                  const age = parseInt(petAgeRaw) || 0;
                  const unitText = age === 1 ? "year old" : "years old";
                  setPetAge(`${age} ${unitText}`);
                }}
              >
                <Text style={[
                  styles.unitText,
                  petAgeUnit !== "months" && styles.unitTextActive,
                ]}>Years</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  petAgeUnit === "months" && styles.unitButtonActive,
                ]}
                onPress={() => {
                  setPetAgeUnit("months");
                  const age = parseInt(petAgeRaw) || 0;
                  const unitText = age === 1 ? "month old" : "months old";
                  setPetAge(`${age} ${unitText}`);
                }}
              >
                <Text style={[
                  styles.unitText,
                  petAgeUnit === "months" && styles.unitTextActive,
                ]}>Months</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Breed */}
          <Text style={styles.label}>Breed</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setBreedModalVisible(true)}
            disabled={!selectedAnimal}
          >
            <Text style={{ color: selectedBreed ? "#333" : "#999" }}>
              {selectedBreed || (selectedAnimal ? "Choose breed" : "Select animal first")}
            </Text>
            {selectedAnimal && <Ionicons name="chevron-down" size={20} color="#666" />}
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

          {/* Service Modal */}
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

          {/* Date - Calendar Modal */}
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

          {/* Calendar Modal */}
          <Modal visible={showCalendar} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.calendarModalBox}>
                {/* Header */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={goToPrevMonth}>
                    <Ionicons name="chevron-back" size={24} color="#00BFA6" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthYear}>
                    {monthNames[currentCalendarMonth]} {currentCalendarYear}
                  </Text>
                  <TouchableOpacity onPress={goToNextMonth}>
                    <Ionicons name="chevron-forward" size={24} color="#00BFA6" />
                  </TouchableOpacity>
                </View>

                {/* Weekdays */}
                <View style={styles.weekdays}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <Text key={d} style={styles.weekdayText}>{d}</Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.calendarGrid}>
                  {calendarDays.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        !item.day && styles.emptyDay,
                        item.isPast && styles.pastDay,
                        item.isToday && styles.todayDay,
                        item.isSelected && styles.selectedDay,
                      ]}
                      onPress={() => handleDateSelect(item)}
                      disabled={!item.day || item.isPast}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        !item.day && { color: "transparent" },
                        item.isPast && { color: "#ccc" },
                        item.isToday && { color: "#00BFA6", fontWeight: "bold" },
                        item.isSelected && { color: "#fff" },
                      ]}>
                        {item.day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeCalendarButton}
                  onPress={() => setShowCalendar(false)}
                >
                  <Text style={styles.closeCalendarText}>Close</Text>
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
      </TouchableWithoutFeedback>
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
  calendarModalBox: { backgroundColor: "#fff", borderRadius: 20, width: "90%", padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  serviceOption: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#f1f1f1" },
  serviceText: { fontSize: 16 },

  // Age
  ageContainer: { flexDirection: "row", alignItems: "center" },
  unitToggle: { flexDirection: "row", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, overflow: "hidden" },
  unitButton: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "#f9f9f9" },
  unitButtonActive: { backgroundColor: "#00BFA6" },
  unitText: { fontSize: 14, color: "#666" },
  unitTextActive: { color: "#fff", fontWeight: "600" },

  // Calendar
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  calendarMonthYear: { fontSize: 18, fontWeight: "bold", color: "#333" },
  weekdays: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  weekdayText: { flex: 1, textAlign: "center", fontWeight: "600", color: "#666", fontSize: 14 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: { width: `${100 / 7}%`, aspectRatio: 1, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  emptyDay: { backgroundColor: "transparent" },
  pastDay: { opacity: 0.4 },
  todayDay: { backgroundColor: "#e6f7f5", borderRadius: 20, borderWidth: 1, borderColor: "#00BFA6" },
  selectedDay: { backgroundColor: "#00BFA6", borderRadius: 20 },
  calendarDayText: { fontSize: 15 },

  closeCalendarButton: { marginTop: 20, backgroundColor: "#eee", padding: 12, borderRadius: 10, alignItems: "center" },
  closeCalendarText: { fontWeight: "600", color: "#333" },

  timeSlots: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeButton: { borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8 },
  timeButtonActive: { backgroundColor: "#00BFA6", borderColor: "#00BFA6" },
  timeButtonBooked: { backgroundColor: "#ccc", borderColor: "#ccc" },
  timeText: { color: "#444" },
  timeTextActive: { color: "#fff" },
  timeTextBooked: { color: "#999" },

  petDropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 180,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petSuggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  petSuggestionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  petSuggestionSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
});