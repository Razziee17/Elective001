import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const openCategory = (category) => {
    setSelectedCategory(category);
    setCategoryModalVisible(true);
  };

  const servicesPreview = [
    { name: "Check-up", icon: "medkit-outline", color: "#C9F0FF" },
    { name: "Treatment", icon: "bandage-outline", color: "#FEE3EC" },
    { name: "Diagnostics", icon: "flask-outline", color: "#E2F0CB" },
    { name: "Ultrasound", icon: "pulse-outline", color: "#FFE2E2" },
    { name: "X-ray", icon: "medkit-outline", color: "#D6F5E5" },
    { name: "Laser Therapy", icon: "sunny-outline", color: "#E9D8FD" },
  ];

  const allServices = [
    { name: "Check-up", icon: "medkit-outline", color: "#C9F0FF" },
    { name: "Treatment", icon: "bandage-outline", color: "#FEE3EC" },
    { name: "Diagnostics", icon: "flask-outline", color: "#E2F0CB" },
    { name: "Ultrasound", icon: "pulse-outline", color: "#FFE2E2" },
    { name: "X-ray", icon: "medkit-outline", color: "#D6F5E5" },
    { name: "Laser Therapy", icon: "sunny-outline", color: "#E9D8FD" },
    { name: "Major and Minor Surgery", icon: "medical-outline", color: "#D6E5FA" },
    { name: "Vaccination", icon: "medkit-outline", color: "#FFE2E2" },
    { name: "Deworming", icon: "bug-outline", color: "#E9D8FD" },
    { name: "Grooming", icon: "cut-outline", color: "#FEE3EC" },
    { name: "Confinement", icon: "home-outline", color: "#C9F0FF" },
  ];

  const descriptions = {
    "Check-up": "General wellness check for pets by a licensed veterinarian.",
    Treatment: "Comprehensive care for illnesses and minor injuries.",
    Diagnostics: "Includes blood exams, microscopy, and rapid test kits for pets.",
    Ultrasound: "Non-invasive ultrasound imaging for health monitoring.",
    "X-ray": "Digital radiography for internal assessment.",
    "Laser Therapy": "Promotes healing and reduces pain using laser treatment.",
    "Major and Minor Surgery": "Safe and sterile surgical operations for pets.",
    Vaccination: "Protect pets against core and non-core diseases.",
    Deworming: "Removes internal parasites to ensure a healthy pet.",
    Grooming: "Bathing, nail trimming, and coat care for your pets.",
    Confinement: "Short-term care and monitoring for recovering pets.",
  };

  const handleLogout = () => {
    setMenuVisible(false);
    navigation.replace("Login");
  };

  const openServiceDetail = (service) => {
    setSelectedService(service);
    setDetailVisible(true);
  };

  const handleBookAppointment = () => {
    setDetailVisible(false);
    navigation.navigate("Appointments");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 👤 Profile Modal */}
      <Modal visible={profileVisible} transparent animationType="fade" onRequestClose={() => setProfileVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.profileBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Owner Information</Text>
              <TouchableOpacity onPress={() => setProfileVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>Mae Anne Tullao</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>maeanne.tullao@email.com</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>+63 912 345 6789</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>Cabanatuan City, Nueva Ecija</Text>
            </View>
            <TouchableOpacity style={styles.closeProfileButton} onPress={() => setProfileVisible(false)}>
              <Text style={styles.closeProfileText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* (Rest of code continues same as previous, unchanged beyond header removal) */}
            {/* Announcement */}
      <View style={styles.announcementCard}>
        <Image
          source={require("../assets/dog.png")}
          style={styles.announcementImage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.announcementTitle}>Caring for Your Pets</Text>
          <Text style={styles.announcementText}>
            Schedule a vet appointment easily and keep your pets healthy!
          </Text>
        </View>
      </View>

      {/* 🐾 Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => setSeeAllVisible(true)}>
          <Text style={styles.linkText}></Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {["Canine", "Feline", "Small mammals", "Exotics", "Birds", "Farm Animals"].map((category, i) => (
          <TouchableOpacity
            key={i}
            style={styles.categoryItem}
            onPress={() => openCategory(category)}
          >
            <View style={styles.categoryBox}>
              <Ionicons name="paw-outline" size={28} color="#00BFA6" />
            </View>
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Services */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <TouchableOpacity onPress={() => setSeeAllVisible(true)}>
          <Text style={styles.linkText}>See all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.servicesGrid}>
        {servicesPreview.map((service, i) => (
          <TouchableOpacity
            key={i}
            style={styles.serviceCard}
            onPress={() => openServiceDetail(service)}
          >
            <View style={[styles.iconCircle, { backgroundColor: service.color }]}>
              <Ionicons name={service.icon} size={24} color="#333" />
            </View>
            <Text style={styles.serviceText}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 🔔 Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.notificationBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.notificationItem}>
              🐶 Appointment confirmed for Bella on Oct 12, 2025
            </Text>
            <Text style={styles.notificationItem}>
              💊 Reminder: Deworming scheduled tomorrow at 3 PM
            </Text>
            <Text style={styles.notificationItem}>
              📅 Check-up available slots updated
            </Text>
          </View>
        </View>
      </Modal>

      {/* 🍔 Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => alert("FAQ")}>
              <Text style={styles.menuText}>FAQ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => alert("Contact Us")}
            >
              <Text style={styles.menuText}>Contact Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => alert("About Us")}
            >
              <Text style={styles.menuText}>About Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderTopWidth: 1, borderColor: "#eee" }]}
              onPress={handleLogout}
            >
              <Text style={[styles.menuText, { color: "#FF4C4C" }]}>Log out →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 📋 See All Categories Modal */}
      <Modal visible={seeAllVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Categories</Text>
              <TouchableOpacity onPress={() => setSeeAllVisible(false)}>
                <Ionicons name="close" size={26} color="#333" />
              </TouchableOpacity>
            </View>

            {[
              "Canine",
              "Feline",
              "Small mammals",
              "Exotics",
              "Birds",
              "Farm animals",
            ].map((category, i) => (
              <TouchableOpacity
                key={i}
                style={styles.listItem}
                onPress={() => {
                  openCategory(category);
                  setSeeAllVisible(false);
                }}
              >
                <Text style={styles.listText}>{category}</Text>
                <Ionicons name="chevron-forward" size={20} color="#00BFA6" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* 🐕 Category Animal List Modal */}
      <Modal visible={categoryModalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategory}</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={26} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                selectedCategory === "Canine"
                  ? ["Dog", "Labrador", "German Shepherd", "Beagle", "Bulldog"]
                  : selectedCategory === "Feline"
                  ? ["Cat", "Siamese", "Persian", "Bengal", "Maine Coon"]
                  : selectedCategory === "Small mammals"
                  ? ["Rabbit", "Hamster", "Guinea Pig", "Ferret"]
                  : selectedCategory === "Exotics"
                  ? ["Snake", "Lizard", "Turtle", "Iguana"]
                  : selectedCategory === "Birds"
                  ? ["Parrot", "Cockatiel", "Canary", "Lovebird"]
                  : ["Cow", "Goat", "Pig", "Chicken", "Sheep"]
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem}>
                  <Text style={styles.listText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal: All Services */}
      <Modal visible={seeAllVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Services</Text>
              <Pressable onPress={() => setSeeAllVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.allServicesGrid}>
                {allServices.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.allServiceCard}
                    onPress={() => openServiceDetail(item)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                      <Ionicons name={item.icon} size={26} color="#333" />
                    </View>
                    <Text style={styles.allServiceText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Service Detail */}
      <Modal visible={detailVisible} animationType="fade" transparent>
        <View style={styles.detailOverlay}>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>{selectedService?.name}</Text>
            <Text style={styles.detailText}>
              {descriptions[selectedService?.name] ||
                "This service helps ensure your pet’s health and wellness."}
            </Text>
            <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Book Appointment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, { marginTop: 10 }]}
              onPress={() => setDetailVisible(false)}
            >
              <Text style={{ color: "#00BFA6", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  profileBox: { backgroundColor: "#fff", borderRadius: 20, width: "85%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoText: { marginLeft: 8, fontSize: 15, color: "#333" },
  closeProfileButton: { backgroundColor: "#00BFA6", borderRadius: 30, paddingVertical: 10, alignItems: "center", marginTop: 20 },
  closeProfileText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
    container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: "600", color: "#333" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    marginHorizontal: 20,
    borderRadius: 10,
    marginVertical: 15,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  searchInput: { flex: 1, padding: 10 },
  announcementCard: {
    flexDirection: "row",
    backgroundColor: "#E0F7F4",
    borderRadius: 15,
    padding: 10,
    marginBottom: 25,
    alignItems: "center",
    marginTop: 20,
  },
  announcementImage: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 10,
  },
  announcementTitle: {
    fontWeight: "bold",
    color: "#00BFA6",
    fontSize: 16,
  },
  announcementText: {
    fontSize: 13,
    color: "#555",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  linkText: { color: "#00BFA6", fontWeight: "bold" },
  categories: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 20,
    width: "22%",
    marginBottom: 10, // Consolidated from duplicate definitions
  },
  categoryBox: {
    width: 60,
    height: 60,
    backgroundColor: "#E0F7F4",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    paddingHorizontal: 10,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
    width: "42%",
    paddingVertical: 15,
    marginVertical: 8,
    alignItems: "center",
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceText: { fontWeight: "600", color: "#333", textAlign: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    height: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 15,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  allServicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  allServiceCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
    paddingVertical: 15,
    marginVertical: 8,
    alignItems: "center",
  },
  allServiceText: { fontWeight: "600", color: "#333", textAlign: "center" },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "85%",
    padding: 25,
    alignItems: "center",
  },
  detailTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  detailText: { fontSize: 15, color: "#444", textAlign: "center", marginBottom: 20 },
  bookButton: {
    backgroundColor: "#00BFA6",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButton: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#00BFA6",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  notificationBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "85%",
    padding: 20,
  },
  notificationItem: { paddingVertical: 6, color: "#333", fontSize: 15 },
  menuBox: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 180,
    paddingVertical: 8,
    boxShadow: "0 4px 6px rgba(0,0,0,0.15)", // Replaced shadow* with boxShadow
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 15 },
  menuText: { fontSize: 15, color: "#333" },
  profileBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "85%",
    padding: 20,
    boxShadow: "0 6px 12px rgba(0,0,0,0.2)", // Replaced shadow* with boxShadow
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  closeProfileButton: {
    backgroundColor: "#00BFA6",
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 20,
  },
  closeProfileText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  listText: { fontSize: 16, color: "#333" },
});
