import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen({ setNotificationsVisible, setMenuVisible }) {
  const navigation = useNavigation();
  const [seeAllVisible, setSeeAllVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [notificationsVisibleLocal, setNotificationsVisibleLocal] = useState(false);
  const [menuVisibleLocal, setMenuVisibleLocal] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Use props if provided, otherwise use local state
  const notificationsVisible = setNotificationsVisible ? notificationsVisibleLocal : notificationsVisibleLocal;
  const setNotificationsVisibleFinal = setNotificationsVisible || setNotificationsVisibleLocal;
  const menuVisible = setMenuVisible ? menuVisibleLocal : menuVisibleLocal;
  const setMenuVisibleFinal = setMenuVisible || setMenuVisibleLocal;

  // Ensure servicesPreview is defined
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

  // Sample notifications data (replace with API data in production)
  const notifications = [
    { id: "1", message: "🐶 Appointment confirmed for Bella on Oct 12, 2025", timestamp: "2025-10-10 10:00 AM" },
    { id: "2", message: "💊 Reminder: Deworming scheduled tomorrow at 3 PM", timestamp: "2025-10-11 2:00 PM" },
    { id: "3", message: "📅 Check-up available slots updated", timestamp: "2025-10-11 9:00 AM" },
  ];

  const openCategory = (category) => {
    setSelectedCategory(category);
    setCategoryModalVisible(true);
  };

  const handleLogout = () => {
    setMenuVisibleFinal(false);
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.announcementCard}>
          <Image source={require("../assets/dog.png")} style={styles.announcementImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.announcementTitle}>Caring for Your Pets</Text>
            <Text style={styles.announcementText}>Schedule a vet appointment easily and keep your pets healthy!</Text>
          </View>
        </View>

        {/* 🐾 Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity onPress={() => setSeeAllVisible(true)}>
            <Text style={styles.linkText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {["Canine", "Feline", "Small mammals", "Exotics", "Birds", "Farm Animals"].map((category, i) => (
            <TouchableOpacity key={i} style={styles.categoryItem} onPress={() => openCategory(category)}>
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
            <TouchableOpacity key={i} style={styles.serviceCard} onPress={() => openServiceDetail(service)}>
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
          animationType="slide"
          onRequestClose={() => setNotificationsVisibleFinal(false)}
        >
          <TouchableOpacity
            style={styles.notificationOverlay}
            activeOpacity={1}
            onPressOut={() => setNotificationsVisibleFinal(false)}
          >
            <View style={styles.notificationBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notifications</Text>
                <TouchableOpacity onPress={() => setNotificationsVisibleFinal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <Text style={styles.notificationText}>{item.message}</Text>
                    <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noNotificationsText}>No notifications available</Text>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 🍔 Menu Modal */}
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisibleFinal(false)}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPressOut={() => setMenuVisibleFinal(false)}
          >
            <View style={styles.menuBox}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisibleFinal(false);
                  navigation.navigate("AboutUs");
                }}
              >
                <Text style={styles.menuText}>About Us</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisibleFinal(false);
                  navigation.navigate("ContactUs");
                }}
              >
                <Text style={styles.menuText}>Contact Us</Text>
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
              {["Canine", "Feline", "Small mammals", "Exotics", "Birds", "Farm animals"].map((category, i) => (
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
                    <TouchableOpacity key={index} style={styles.allServiceCard} onPress={() => openServiceDetail(item)}>
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
                {descriptions[selectedService?.name] || "This service helps ensure your pet's health and wellness."}
              </Text>
              <TouchableOpacity style={styles.bookButton} onPress={handleBookAppointment}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Book Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.closeButton, { marginTop: 10 }]} onPress={() => setDetailVisible(false)}>
                <Text style={{ color: "#00BFA6", fontWeight: "bold" }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  notificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingRight: 16,
  },
  notificationBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 300,
    maxHeight: "50%",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notificationText: {
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTimestamp: {
    color: "#777",
    fontSize: 12,
    marginTop: 4,
  },
  noNotificationsText: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  announcementCard: {
    flexDirection: "row",
    backgroundColor: "#E0F7F4",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    marginTop: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementImage: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 12,
  },
  announcementTitle: {
    fontWeight: "700",
    color: "#00BFA6",
    fontSize: 16,
    marginBottom: 4,
  },
  announcementText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 0,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  linkText: { color: "#00BFA6", fontWeight: "600", fontSize: 14 },
  categories: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 20,
    width: "22%",
  },
  categoryBox: {
    width: 64,
    height: 64,
    backgroundColor: "#E0F7F4",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    width: "48%",
    paddingVertical: 18,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  serviceText: { fontWeight: "600", color: "#333", textAlign: "center", fontSize: 13 },
  profileBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "85%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoText: { marginLeft: 12, fontSize: 15, color: "#333", fontWeight: "500" },
  closeProfileButton: {
    backgroundColor: "#00BFA6",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#00BFA6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeProfileText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  menuBox: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    width: 180,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 16 },
  menuText: { fontSize: 15, color: "#333", fontWeight: "500" },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  listText: { fontSize: 16, color: "#333", fontWeight: "500" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  allServicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  allServiceCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    paddingVertical: 18,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  allServiceText: { fontWeight: "600", color: "#333", textAlign: "center", fontSize: 13 },
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
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  detailTitle: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#1a1a1a" },
  detailText: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  bookButton: {
    backgroundColor: "#00BFA6",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#00BFA6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#00BFA6",
  },
});