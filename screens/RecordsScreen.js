import React, { useContext, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../components/AppHeader";
import { useAppointments } from "../context/AppointmentContext";
// 🧩 Example simple auth role context
const UserContext = React.createContext({ role: "user" }); // default is user

export default function RecordsScreen() {
  const [activeTab, setActiveTab] = useState("Appointments");
  const {
    pendingAppointments,
    approvedAppointments,
    completedAppointments,
    updateAppointmentStatus,
  } = useAppointments();

  const { role } = useContext(UserContext); // "admin" or "user"

  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [prescription, setPrescription] = useState({
    medicine: "",
    dosage: "",
    duration: "",
    notes: "",
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const handleComplete = (appt) => {
    setSelectedAppt(appt);
    setPrescriptionModal(true);
  };

  const savePrescription = () => {
    if (!prescription.medicine || !prescription.dosage) {
      alert("Please fill in at least medicine name and dosage.");
      return;
    }

    updateAppointmentStatus(selectedAppt.id, "completed", prescription);
    setPrescription({
      medicine: "",
      dosage: "",
      duration: "",
      notes: "",
    });
    setPrescriptionModal(false);
  };

  const renderStatusButton = (appt) => {
    if (role !== "admin") {
      // For normal user: show colored badge only
      return (
        <View
          style={[
            styles.statusButton,
            {
              backgroundColor:
                appt.status === "pending"
                  ? "#f0ad4e"
                  : appt.status === "approved"
                  ? "#5bc0de"
                  : "#5cb85c",
            },
          ]}
        >
          <Text style={styles.statusText}>{appt.status.toUpperCase()}</Text>
        </View>
      );
    }

    // ✅ Admin can click to update
    return (
      <TouchableOpacity
        onPress={() => {
          if (appt.status === "pending") {
            updateAppointmentStatus(appt.id, "approved");
          } else if (appt.status === "approved") {
            handleComplete(appt);
          }
        }}
        style={[
          styles.statusButton,
          {
            backgroundColor:
              appt.status === "pending"
                ? "#f0ad4e"
                : appt.status === "approved"
                ? "#5bc0de"
                : "#5cb85c",
          },
        ]}
      >
        <Text style={styles.statusText}>{appt.status.toUpperCase()}</Text>
      </TouchableOpacity>
    );
  };

  const renderAppointment = (appt) => (
    <View key={appt.id} style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{appt.petName}</Text>
        <Text style={styles.details}>
          {appt.service} • {appt.date} • {appt.time}
        </Text>
        {appt.prescription && (
          <View style={styles.medsBox}>
            <Text style={styles.medsTitle}>Prescription:</Text>
            <Text style={styles.medsItem}>💊 {appt.prescription.medicine}</Text>
            <Text style={styles.medsItem}>
              📏 {appt.prescription.dosage} — {appt.prescription.duration}
            </Text>
            {appt.prescription.notes ? (
              <Text style={styles.medsItem}>🗒️ {appt.prescription.notes}</Text>
            ) : null}
          </View>
        )}
      </View>

      {renderStatusButton(appt)}
    </View>
  );

  const renderContent = () => {
    if (activeTab === "Appointments") {
      const all = [...pendingAppointments, ...approvedAppointments];
      return all.length ? (
        all.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No Appointments</Text>
      );
    }
    if (activeTab === "Medication") {
      return completedAppointments.length ? (
        completedAppointments.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No Medication Records</Text>
      );
    }
    if (activeTab === "History") {
      return completedAppointments.length ? (
        completedAppointments.map(renderAppointment)
      ) : (
        <Text style={styles.emptyText}>No History Yet</Text>
      );
    }
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
        <View style={styles.container}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            {["Appointments", "Medication", "History"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && styles.activeTabButton,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.scrollContainer}>{renderContent()}</ScrollView>

          {/* 🧾 Prescription Modal (Admin only) */}
          {role === "admin" && (
            <Modal visible={prescriptionModal} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Add Prescription</Text>

                  <TextInput
                    placeholder="Medicine Name"
                    style={styles.input}
                    value={prescription.medicine}
                    onChangeText={(text) =>
                      setPrescription((p) => ({ ...p, medicine: text }))
                    }
                  />
                  <TextInput
                    placeholder="Dosage (e.g., 2x a day)"
                    style={styles.input}
                    value={prescription.dosage}
                    onChangeText={(text) =>
                      setPrescription((p) => ({ ...p, dosage: text }))
                    }
                  />
                  <TextInput
                    placeholder="Duration (e.g., 5 days)"
                    style={styles.input}
                    value={prescription.duration}
                    onChangeText={(text) =>
                      setPrescription((p) => ({ ...p, duration: text }))
                    }
                  />
                  <TextInput
                    placeholder="Additional Notes"
                    style={[styles.input, { height: 80 }]}
                    multiline
                    value={prescription.notes}
                    onChangeText={(text) =>
                      setPrescription((p) => ({ ...p, notes: text }))
                    }
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setPrescriptionModal(false)}
                    >
                      <Text style={{ color: "#555" }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      onPress={savePrescription}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 10, marginTop: -15},
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 50,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 30,
  },
  activeTabButton: { backgroundColor: "#00BFA6" },
  tabText: { fontSize: 16, color: "#333", fontWeight: "500" },
  activeTabText: { color: "#fff", fontWeight: "bold" },
  scrollContainer: { paddingHorizontal: 20 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  petName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  details: { color: "#666", marginTop: 3 },
  statusButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 6,
    justifyContent: "center",
  },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyText: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 40,
    fontSize: 16,
  },
  medsBox: {
    marginTop: 8,
    backgroundColor: "#E8FFF9",
    padding: 8,
    borderRadius: 10,
  },
  medsTitle: { fontWeight: "bold", color: "#00BFA6" },
  medsItem: { color: "#333", fontSize: 13, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#00BFA6", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#00BFA6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});
