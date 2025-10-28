import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy"; // ← LEGACY (no deprecation)
import { getAuth, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigation } from "@react-navigation/native";
import { auth, db, storage } from "../firebase";

export default function ProfileScreen() {
  const [editVisible, setEditVisible] = useState(false);
  const [petModalVisible, setPetModalVisible] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const navigation = useNavigation();

  const [user, setUser] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    profileImage: "",
  });
  const [pets, setPets] = useState([]);
  const [tempUser, setTempUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [tempPet, setTempPet] = useState({
    name: "",
    age: "",
    categories: "",
    breed: "",
    gender: "Male",
  });
  const [image, setImage] = useState(null);
  const [largeImageVisible, setLargeImageVisible] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [breedOpen, setBreedOpen] = useState(false);

  const breedOptions = {
    Dog: ["Labrador", "German Shepherd", "Bulldog", "Beagle"],
    Cat: ["Persian", "Siamese", "Maine Coon", "Tabby"],
    Rabbit: ["Dutch", "Lop", "Rex", "Mini Lop"],
    Bird: ["Parrot", "Canary", "Cockatiel", "Finch"],
  };

  // Permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Needed", "Allow photo access to change profile picture.");
        }
      }
    })();
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        navigation.replace("Login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        let userData = {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          address: "",
          profileImage: "",
        };

        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          const defaultUser = {
            firstName: "User",
            lastName: "",
            email: auth.currentUser.email || "",
            phone: "",
            address: "",
            profileImage: "",
          };
          await setDoc(doc(db, "users", userId), defaultUser);
          userData = defaultUser;
        }

        const domesticPhone = userData.phone
          ? userData.phone.replace("+63", "0").replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3")
          : "";

        const displayName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";

        const displayUser = {
          displayName,
          email: userData.email || "",
          phone: domesticPhone,
          address: userData.address || "",
          profileImage: userData.profileImage || "",
        };

        setUser(displayUser);
        setTempUser({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          email: userData.email || "",
          phone: domesticPhone,
          address: userData.address || "",
        });
        setImage(userData.profileImage || null);

        const petsQuery = query(collection(db, "pets"), where("userId", "==", userId));
        const snapshot = await getDocs(petsQuery);
        setPets(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Fetch error:", error);
        Alert.alert("Error", "Failed to load data.");
      }
    };

    fetchData();
  }, [navigation]);

  // Phone formatter
  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, "");
    if (!cleaned.startsWith("09") || cleaned.length > 11) return text.slice(0, 12);
    let formatted = "";
    if (cleaned.length > 0) formatted += cleaned.substring(0, 4);
    if (cleaned.length > 4) formatted += "-" + cleaned.substring(4, 7);
    if (cleaned.length > 7) formatted += "-" + cleaned.substring(7, 11);
    return formatted;
  };

  // Image Picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log("Picked image URI:", uri);
      setImage(uri);
    }
  };

  // Save Profile - FULLY FIXED UPLOAD
  const handleSaveProfile = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const cleaned = tempUser.phone.replace(/\D/g, "");
    if (cleaned.length !== 11 || !cleaned.startsWith("09")) {
      Alert.alert("Error", "Valid PH number required: 0917-123-4567");
      return;
    }

    const internationalPhone = `+63${cleaned.substring(1)}`;

    try {
      let profileImageUrl = user.profileImage || "";

      // UPLOAD IMAGE - FIXED: base64 → Blob without fetch()
      if (image && image !== user.profileImage) {
        console.log("Starting upload for:", image);
        try {
          const base64 = await FileSystem.readAsStringAsync(image, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log("Base64 length:", base64?.length);

          if (!base64) throw new Error("Failed to read image as base64");

          // Convert base64 to Blob
          const binary = atob(base64);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const blob = new Blob([new Uint8Array(array)], { type: "image/jpeg" });

          const storageRef = ref(storage, `user-profile-images/${userId}/profile.jpg`);
          await uploadBytes(storageRef, blob);
          profileImageUrl = await getDownloadURL(storageRef);

          setSuccessModalVisible(true);
          setTimeout(() => setSuccessModalVisible(false), 800);
        } catch (uploadError) {
          console.error("Upload failed:", uploadError);
          Alert.alert("Upload Failed", uploadError.message || "Please try a smaller image.");
          return;
        }
      }

      // SAVE TO FIRESTORE
      const updateData = {
        firstName: tempUser.firstName.trim(),
        lastName: tempUser.lastName.trim(),
        email: tempUser.email.trim(),
        phone: internationalPhone,
        address: tempUser.address.trim(),
        profileImage: profileImageUrl,
      };

      await setDoc(doc(db, "users", userId), updateData, { merge: true });

      const displayName = `${updateData.firstName} ${updateData.lastName}`.trim();
      const formattedPhone = internationalPhone.replace("+63", "0").replace(/(\d{4})(\d{3})(\d{4})/, "$1-$2-$3");

      setUser({
        displayName,
        email: updateData.email,
        phone: formattedPhone,
        address: updateData.address,
        profileImage: profileImageUrl,
      });

      setEditVisible(false);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", `Save failed: ${error.message}`);
    }
  };

  // === PET FUNCTIONS (UNCHANGED) ===
  const openPetModal = (pet) => {
    setSelectedPet(pet);
    setTempPet({
      name: pet.name || "",
      age: pet.age || "",
      categories: pet.categories || "",
      breed: pet.breed || "",
      gender: pet.gender || "Male",
    });
    setIsAddingPet(false);
    setPetModalVisible(true);
    setCategoryOpen(false);
    setBreedOpen(false);
  };

  const openAddPetModal = () => {
    setTempPet({ name: "", age: "", categories: "", breed: "", gender: "Male" });
    setSelectedPet(null);
    setIsAddingPet(true);
    setPetModalVisible(true);
    setCategoryOpen(false);
    setBreedOpen(false);
  };

  const handleSavePet = async () => {
    if (!tempPet.name || !tempPet.age || !tempPet.categories || !tempPet.breed) {
      Alert.alert("Error", "Fill all pet fields.");
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      if (isAddingPet) {
        const newPet = { ...tempPet, userId };
        const docRef = await addDoc(collection(db, "pets"), newPet);
        setPets((prev) => [...prev, { id: docRef.id, ...newPet }]);
      } else {
        const petRef = doc(db, "pets", selectedPet.id);
        await updateDoc(petRef, tempPet);
        setPets((prev) =>
          prev.map((p) => (p.id === selectedPet.id ? { ...p, ...tempPet } : p))
        );
      }
      setPetModalVisible(false);
      Alert.alert("Success", isAddingPet ? "Pet added!" : "Pet updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to save pet.");
    }
  };

  const handleDeletePet = (petId) => {
    Alert.alert("Delete", "Remove this pet?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "pets", petId));
          setPets((prev) => prev.filter((p) => p.id !== petId));
          Alert.alert("Deleted", "Pet removed.");
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          await signOut(auth);
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setLargeImageVisible(true)}>
            <Image
              source={image ? { uri: image } : require("../assets/profile.jpg")}
              style={styles.profileImage}
              onError={() => setImage(null)}
            />
          </TouchableOpacity>
          <Text style={styles.userName}>{user.displayName}</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={18} color="#00BFA6" />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#00BFA6" />
            <Text style={styles.infoText}>{user.email || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#00BFA6" />
            <Text style={styles.infoText}>{user.phone || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#00BFA6" />
            <Text style={styles.infoText}>{user.address || "N/A"}</Text>
          </View>
        </View>

        {/* Pets */}
        <View style={styles.petsHeader}>
          <Text style={styles.sectionTitle}>My Pets</Text>
          <TouchableOpacity onPress={openAddPetModal}>
            <Ionicons name="add-circle-outline" size={26} color="#00BFA6" />
          </TouchableOpacity>
        </View>

        <View style={styles.petContainer}>
          {pets.map((pet) => (
            <View key={pet.id} style={styles.petCardContainer}>
              <TouchableOpacity style={styles.petCard} onPress={() => openPetModal(pet)}>
                <Ionicons
                  name={pet.categories === "Dog" ? "paw-outline" : "logo-octocat"}
                  size={24}
                  color="#00BFA6"
                  style={{ marginRight: 10 }}
                />
                <View style={styles.petDetails}>
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petInfo}>Age: {pet.age}</Text>
                  <Text style={styles.petInfo}>Category: {pet.categories}</Text>
                  <Text style={styles.petInfo}>Breed: {pet.breed}</Text>
                  <Text style={styles.petInfo}>Gender: {pet.gender}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePet(pet.id)}>
                <Ionicons name="trash-outline" size={20} color="#FF4C4C" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Edit Profile Modal */}
        <Modal visible={editVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <ScrollView>
                <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                  <Image
                    source={image ? { uri: image } : require("../assets/profile.jpg")}
                    style={styles.profileImage}
                  />
                  <Text style={styles.imagePickerText}>Change Picture</Text>
                </TouchableOpacity>

                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={tempUser.firstName}
                  onChangeText={(t) => setTempUser({ ...tempUser, firstName: t })}
                />

                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={tempUser.lastName}
                  onChangeText={(t) => setTempUser({ ...tempUser, lastName: t })}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={tempUser.email}
                  onChangeText={(t) => setTempUser({ ...tempUser, email: t })}
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={tempUser.phone}
                  onChangeText={(t) => setTempUser({ ...tempUser, phone: formatPhoneNumber(t) })}
                  placeholder="0917-123-4567"
                  keyboardType="phone-pad"
                  maxLength={13}
                />

                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={tempUser.address}
                  onChangeText={(t) => setTempUser({ ...tempUser, address: t })}
                />
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#00BFA6" }]}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { borderWidth: 1, borderColor: "#00BFA6" }]}
                  onPress={() => setEditVisible(false)}
                >
                  <Text style={{ color: "#00BFA6", fontWeight: "bold" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Pet Modal */}
        <Modal visible={petModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { overflow: "hidden" }]}>
              <Text style={styles.modalTitle}>
                {isAddingPet ? "Add Pet" : "Pet Details"}
              </Text>

              <ScrollView style={{ maxHeight: "70%" }}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={tempPet.name}
                  onChangeText={(t) => setTempPet({ ...tempPet, name: t })}
                />

                <Text style={styles.label}>Age</Text>
                <TextInput
                  style={styles.input}
                  value={tempPet.age}
                  keyboardType="numeric"
                  onChangeText={(t) => setTempPet({ ...tempPet, age: t })}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setCategoryOpen(!categoryOpen)}
                  >
                    <Text>{tempPet.categories || "Select Category"}</Text>
                    <Ionicons name={categoryOpen ? "chevron-up" : "chevron-down"} size={16} />
                  </TouchableOpacity>
                  {categoryOpen && (
                    <View style={styles.dropdownContent}>
                      {["Dog", "Cat", "Rabbit", "Bird"].map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setTempPet({ ...tempPet, categories: cat, breed: "" });
                            setCategoryOpen(false);
                          }}
                        >
                          <Text>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={styles.label}>Breed</Text>
                <View style={styles.dropdownWrapper}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => tempPet.categories && setBreedOpen(!breedOpen)}
                    disabled={!tempPet.categories}
                  >
                    <Text style={{ color: tempPet.categories ? "#000" : "#999" }}>
                      {tempPet.breed || "Select Breed"}
                    </Text>
                    {tempPet.categories && (
                      <Ionicons name={breedOpen ? "chevron-up" : "chevron-down"} size={16} />
                    )}
                  </TouchableOpacity>
                  {breedOpen && tempPet.categories && (
                    <View style={styles.dropdownContent}>
                      {breedOptions[tempPet.categories].map((b) => (
                        <TouchableOpacity
                          key={b}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setTempPet({ ...tempPet, breed: b });
                            setBreedOpen(false);
                          }}
                        >
                          <Text>{b}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={styles.label}>Gender</Text>
                <View style={styles.radioContainer}>
                  {["Male", "Female"].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.radioButton}
                      onPress={() => setTempPet({ ...tempPet, gender: g })}
                    >
                      <View style={styles.radioCircle}>
                        {tempPet.gender === g && <View style={styles.radioSelected} />}
                      </View>
                      <Text style={styles.radioText}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#00BFA6" }]}
                  onPress={handleSavePet}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { borderWidth: 1, borderColor: "#00BFA6" }]}
                  onPress={() => setPetModalVisible(false)}
                >
                  <Text style={{ color: "#00BFA6", fontWeight: "bold" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Large Image */}
        <Modal visible={largeImageVisible} transparent onRequestClose={() => setLargeImageVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.largeImageBox}>
              <Image
                source={image ? { uri: image } : require("../assets/profile.jpg")}
                style={styles.largeImage}
              />
              <TouchableOpacity style={styles.closeButton} onPress={() => setLargeImageVisible(false)}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success Flash */}
        <Modal visible={successModalVisible} transparent animationType="fade">
          <View style={styles.successOverlay}>
            <View style={styles.successBox}>
              <Text style={styles.successText}>Profile picture updated!</Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

// Styles (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 20 },
  header: { alignItems: "center", marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  userName: { fontSize: 20, fontWeight: "bold", color: "#333" },
  editButton: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  editText: { color: "#00BFA6", marginLeft: 5, fontWeight: "bold" },
  infoContainer: { backgroundColor: "#E8FFF9", marginHorizontal: 20, borderRadius: 15, padding: 15 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { marginLeft: 10, fontSize: 15, color: "#333" },
  petsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 20, marginTop: 25 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#00BFA6" },
  petContainer: { marginHorizontal: 20, marginTop: 10 },
  petCardContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  petCard: { flexDirection: "row", backgroundColor: "#fff", borderWidth: 1, borderColor: "#eee", borderRadius: 12, padding: 12, flex: 1 },
  petDetails: { flexDirection: "column" },
  petName: { fontWeight: "bold", fontSize: 16, color: "#333" },
  petInfo: { fontSize: 13, color: "#666" },
  deleteButton: { padding: 8 },
  logoutButton: { backgroundColor: "#FF4C4C", marginHorizontal: 20, borderRadius: 25, paddingVertical: 12, alignItems: "center", marginTop: 30, marginBottom: 50 },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalBox: { backgroundColor: "#fff", width: "90%", borderRadius: 20, padding: 20, maxHeight: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  label: { fontWeight: "bold", marginTop: 12, color: "#333" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 10, marginTop: 5 },

  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  modalButton: { flex: 1, alignItems: "center", paddingVertical: 12, marginHorizontal: 5, borderRadius: 25 },
  modalButtonText: { color: "#fff", fontWeight: "bold" },

  imagePicker: { alignItems: "center", marginBottom: 15 },
  imagePickerText: { color: "#00BFA6", marginTop: 5, fontWeight: "bold" },

  dropdownWrapper: { marginTop: 5, zIndex: 10, elevation: 5 },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  dropdownContent: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    maxHeight: 150,
    overflow: "hidden",
    zIndex: 20,
    elevation: 6,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },

  radioContainer: { flexDirection: "row", marginTop: 5 },
  radioButton: { flexDirection: "row", alignItems: "center", marginRight: 15 },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#00BFA6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },
  radioSelected: { height: 10, width: 10, borderRadius: 5, backgroundColor: "#00BFA6" },
  radioText: { fontSize: 16, color: "#333" },

  largeImageBox: { backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center", padding: 20, flex: 1 },
  largeImage: { width: 300, height: 300, borderRadius: 20 },
  closeButton: { position: "absolute", top: 40, right: 20 },

  successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  successBox: { backgroundColor: "#28a745", padding: 15, borderRadius: 10 },
  successText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});