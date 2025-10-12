import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
export default function ProfileScreen() {
  const [editVisible, setEditVisible] = useState(false);
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  // User info state

  const [user, setUser] = useState({
    name: "Mae Anne Tullao",
    email: "maeanne@example.com",
    phone: "0912-345-6789",
    address: "Cabanatuan City, Nueva Ecija",
    pets: [
      { name: "Bella", type: "Dog", age: "2 years" },
      { name: "Mimi", type: "Cat", age: "1 year" },
    ],
  });

  const [tempUser, setTempUser] = useState(user);
  const [tempPet, setTempPet] = useState({ name: "", type: "", age: "" });

  // Save user info changes
  const handleSaveProfile = () => {
    setUser(tempUser);
    setEditVisible(false);
  };

  // Open existing pet for editing
  const openPetModal = (pet) => {
    setSelectedPet(pet);
    setTempPet(pet);
    setIsAddingPet(false);
    setPetModalVisible(true);
  };

  // Open empty modal to add new pet
  const openAddPetModal = () => {
    setTempPet({ name: "", type: "", age: "" });
    setSelectedPet(null);
    setIsAddingPet(true);
    setPetModalVisible(true);
  };

  // Save or update pet info
  const handleSavePet = () => {
    if (!tempPet.name || !tempPet.type || !tempPet.age) {
      alert("Please fill out all pet details.");
      return;
    }

    if (isAddingPet) {
      setUser({ ...user, pets: [...user.pets, tempPet] });
    } else {
      const updatedPets = user.pets.map((p) =>
        p.name === selectedPet.name ? tempPet : p
      );
      setUser({ ...user, pets: updatedPets });
    }

    setPetModalVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <AppHeader
            showIcons={true}
            onProfilePress={() => setProfileVisible(true)}
            onNotificationPress={() => setNotificationsVisible(true)}
            onMenuPress={() => setMenuVisible(true)}
          />
      {/* rest of your code */}
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assets/profile.png")}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>{user.name}</Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditVisible(true)}
            >
              <Ionicons name="create-outline" size={18} color="#00BFA6" />
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>{user.phone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#00BFA6" />
              <Text style={styles.infoText}>{user.address}</Text>
            </View>
          </View>

          {/* My Pets Section */}
          <View style={styles.petsHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            <TouchableOpacity onPress={openAddPetModal}>
              <Ionicons name="add-circle-outline" size={26} color="#00BFA6" />
            </TouchableOpacity>
          </View>

          <View style={styles.petContainer}>
            {user.pets.map((pet, index) => (
              <TouchableOpacity
                key={index}
                style={styles.petCard}
                onPress={() => openPetModal(pet)}
              >
                <Ionicons
                  name={pet.type === "Dog" ? "paw-outline" : "logo-octocat"}
                  size={24}
                  color="#00BFA6"
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petType}>
                    {pet.type} • {pet.age}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton}>
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>

          {/* Edit Profile Modal */}
          <Modal visible={editVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Edit Profile</Text>

                <ScrollView>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    value={tempUser.name}
                    onChangeText={(text) =>
                      setTempUser({ ...tempUser, name: text })
                    }
                  />

                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={tempUser.email}
                    onChangeText={(text) =>
                      setTempUser({ ...tempUser, email: text })
                    }
                  />

                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={tempUser.phone}
                    onChangeText={(text) =>
                      setTempUser({ ...tempUser, phone: text })
                    }
                  />

                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={tempUser.address}
                    onChangeText={(text) =>
                      setTempUser({ ...tempUser, address: text })
                    }
                  />
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#00BFA6" }]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { borderWidth: 1, borderColor: "#00BFA6" },
                    ]}
                    onPress={() => setEditVisible(false)}
                  >
                    <Text style={{ color: "#00BFA6", fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Pet Add/Edit Modal */}
          <Modal visible={petModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>
                  {isAddingPet ? "Add New Pet" : "Pet Details"}
                </Text>

                <Text style={styles.label}>Pet Name</Text>
                <TextInput
                  style={styles.input}
                  value={tempPet.name}
                  onChangeText={(text) => setTempPet({ ...tempPet, name: text })}
                />

                <Text style={styles.label}>Type</Text>
                <TextInput
                  style={styles.input}
                  value={tempPet.type}
                  onChangeText={(text) => setTempPet({ ...tempPet, type: text })}
                />

                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={tempPet.age}
                  onChangeText={(text) => setTempPet({ ...tempPet, age: text })}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: "#00BFA6" }]}
                    onPress={handleSavePet}
                  >
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { borderWidth: 1, borderColor: "#00BFA6" },
                    ]}
                    onPress={() => setPetModalVisible(false)}
                  >
                    <Text style={{ color: "#00BFA6", fontWeight: "bold" }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 20, marginTop: -15 },
  header: { alignItems: "center", marginBottom: 20 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  editText: { color: "#00BFA6", marginLeft: 5, fontWeight: "bold" },
  infoContainer: {
    backgroundColor: "#E8FFF9",
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 15,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { marginLeft: 10, fontSize: 15, color: "#333" },
  petsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#00BFA6",
  },
  petContainer: { marginHorizontal: 20, marginTop: 10 },
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  petName: { fontWeight: "bold", fontSize: 16, color: "#333" },
  petType: { fontSize: 13, color: "#666" },
  logoutButton: {
    backgroundColor: "#FF4C4C",
    marginHorizontal: 20,
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 50,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  label: { fontWeight: "bold", marginTop: 10, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 25,
  },
});
