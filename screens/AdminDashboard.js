// AdminDashboard.js (merged: announcements + appointments + threaded chat)
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase";
import AdminAppointmentsScreen from "./AdminAppointmentsScreen";
import AdminProfileScreen from "./AdminProfileScreen";
import AdminReportsScreen from "./AdminReportsScreen";

export default function AdminDashboard({ navigation }) {
  const [activeScreen, setActiveScreen] = useState("Appointments");
  const [menuVisible, setMenuVisible] = useState(false);

  // announcements
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");

  // appointments notifications (pending)
  const [appointmentsNotifications, setAppointmentsNotifications] = useState([]);
  // separate state for the modal top list (pending)
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // threaded chat (contact_threads)
  const [threads, setThreads] = useState([]); // list of thread docs
  const [chatModalVisible, setChatModalVisible] = useState(false); // show thread list + appointments
  const [selectedThread, setSelectedThread] = useState(null); // thread object
  const [messages, setMessages] = useState([]); // messages for selected thread
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // admin info
  const [adminData, setAdminData] = useState({ firstName: "" });

  const user = auth.currentUser;

  // load admin display name
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!user) return;
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAdminData({ firstName: snap.data().firstName || "Admin" });
        }
      } catch (err) {
        console.log("Error fetching admin data:", err);
      }
    };
    fetchAdminData();
  }, [user]);

  // load announcements once
  const loadAnnouncements = async () => {
    try {
      const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAnnouncements(data);
    } catch (err) {
      console.error("Error loading announcements:", err);
    }
  };
  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Add announcement
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) {
      Alert.alert("Error", "Please enter an announcement message.");
      return;
    }
    try {
      await addDoc(collection(db, "announcements"), {
        text: newAnnouncement.trim(),
        createdBy: adminData.firstName || "Admin",
        createdAt: serverTimestamp(),
      });
      setNewAnnouncement("");
      loadAnnouncements();
      Alert.alert("Success", "Announcement added!");
    } catch (err) {
      console.error("Failed to add announcement:", err);
      Alert.alert("Error", "Failed to add announcement.");
    }
  };

  // Listen to appointmentsNotifications (existing logic for other use)
  useEffect(() => {
    const q = query(collection(db, "appointments"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAppointmentsNotifications(data);
    });
    return unsubscribe;
  }, []);

  // NEW: Listen to pending appointments (top of modal) - include statuses your system uses
  // Some docs may use "upcoming" or "pending" — include both to be safe
  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      where("status", "in", ["pending", "upcoming"]), // include both common variants
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPendingAppointments(list);
      },
      (err) => {
        console.error("Pending appointments listener error:", err);
      }
    );
    return unsubscribe;
  }, []);

  // Listen to contact_threads (threads collection)
  useEffect(() => {
    const q = query(collection(db, "contact_threads"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setThreads(docs);
      },
      (err) => {
        console.error("Threads listener error:", err);
      }
    );
    return unsubscribe;
  }, []);

  // Compute unread badge count: pending appointments + sum(thread.unreadCount || fallback)
  const unreadCount = (() => {
    const apptCount = pendingAppointments.length;
    const threadCount = threads.reduce((acc, t) => {
      if (typeof t.unreadCount === "number") return acc + t.unreadCount;
      // fallback heuristic: if lastSender is 'user' and lastSeenByAdmin is false
      if (t.lastSender === "user" && t.lastSeenByAdmin === false) return acc + 1;
      return acc;
    }, 0);
    return apptCount + threadCount;
  })();

  // Mark overall notifications read: mark thread unreadCount to 0 (optional)
  const markNotificationsAsRead = async () => {
    try {
      // Reset unreadCount on all threads (if field exists)
      const updates = threads.map((t) => {
        if (t.unreadCount && t.unreadCount > 0) {
          return updateDoc(doc(db, "contact_threads", t.id), { unreadCount: 0, lastSeenByAdmin: true });
        }
        if (t.lastSender === "user" && t.lastSeenByAdmin === false) {
          return updateDoc(doc(db, "contact_threads", t.id), { lastSeenByAdmin: true });
        }
        return Promise.resolve();
      });
      await Promise.all(updates);
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  // Open a thread (admin selects it) => set selectedThread and open messages listener
  useEffect(() => {
    if (!selectedThread) {
      // cleanup messages listener if any (handled by returning function below)
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, "contact_threads", selectedThread.id, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMessages(msgs);

        // Mark unseen user messages as seen by admin
        snapshot.docs.forEach(async (d) => {
          const data = d.data();
          if (data.sender === "user" && data.seenByAdmin !== true) {
            try {
              const msgDocRef = doc(db, "contact_threads", selectedThread.id, "messages", d.id);
              await updateDoc(msgDocRef, { seenByAdmin: true });
            } catch (err) {
              console.error("Failed to mark message seenByAdmin:", err);
            }
          }
        });

        // Also clear unreadCount on thread doc
        try {
          const threadDocRef = doc(db, "contact_threads", selectedThread.id);
          setDoc(threadDocRef, { unreadCount: 0, lastSeenByAdmin: true }, { merge: true });
        } catch (err) {
          console.error("Failed to update thread unread meta:", err);
        }
      },
      (err) => {
        console.error("Messages listener error:", err);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.id]);

  // Admin sends reply in selected thread
  const handleSendReply = async () => {
    if (!selectedThread) return;
    if (!replyText.trim()) {
      Alert.alert("Please enter a reply.");
      return;
    }
    setSendingReply(true);
    try {
      const threadRef = doc(db, "contact_threads", selectedThread.id);
      const messagesRef = collection(threadRef, "messages");
      await addDoc(messagesRef, {
        sender: "admin",
        message: replyText.trim(),
        createdAt: serverTimestamp(),
        seenByAdmin: true,
        seenByUser: false,
      });
      // update thread metadata
      await setDoc(threadRef, {
        lastMessage: replyText.trim(),
        lastSender: "admin",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setReplyText("");
    } catch (err) {
      console.error("Failed to send reply:", err);
      Alert.alert("Error", "Failed to send reply. Try again.");
    } finally {
      setSendingReply(false);
    }
  };

  // Approve / Decline appointment + auto message to user
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedAppointment) return;
    try {
      const apptRef = doc(db, "appointments", selectedAppointment.id);
      await updateDoc(apptRef, { status: newStatus });

      // Send auto message to user
      // NOTE: your appointment doc stores the user's UID in the 'id' field (per screenshot).
      const userId = selectedAppointment.id; // using the id field as user UID
      if (userId) {
        const threadRef = doc(db, "contact_threads", userId);
        const messagesRef = collection(db, "contact_threads", userId, "messages");
        await addDoc(messagesRef, {
          sender: "admin",
          message:
            newStatus === "approved"
              ? "✅ Your appointment has been approved. We look forward to seeing you!"
              : "❌ Your appointment has been declined. Please contact the clinic for more info.",
          createdAt: serverTimestamp(),
          seenByUser: false,
          seenByAdmin: true,
        });

        // update thread summary metadata
        await setDoc(threadRef, {
          lastMessage:
            newStatus === "approved"
              ? "✅ Appointment approved"
              : "❌ Appointment declined",
          lastSender: "admin",
          updatedAt: serverTimestamp(),
          lastSeenByAdmin: true,
          lastSeenByUser: false,
        }, { merge: true });
      }

      setSelectedAppointment(null);
    } catch (err) {
      console.error("Error updating appointment:", err);
      Alert.alert("Error", "Failed to update appointment status.");
    }
  };

  // Helper to open thread modal and optionally focus a specific thread
  const openThreadsModal = (threadId = null) => {
    setChatModalVisible(true);
    if (threadId) {
      const t = threads.find((x) => x.id === threadId);
      if (t) setSelectedThread(t);
    }
  };

  // Render main content screens
  const renderScreen = () => {
    switch (activeScreen) {
      case "Appointments":
        return <AdminAppointmentsScreen />;
      case "Reports":
        return <AdminReportsScreen />;
      case "Profile":
        return <AdminProfileScreen navigation={navigation} />;
      default:
        return <AdminAppointmentsScreen />;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged Out", "You have been successfully logged out.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (err) {
      Alert.alert("Error", "Failed to log out. Please try again.");
      console.error("Logout error:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require("../assets/logo.png")} style={styles.logo} />
        <Text style={styles.logoText}>VetPlus | Animal Clinic</Text>

        <Text style={styles.title}>Admin Dashboard</Text>

        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.announceButton}
            onPress={() => setAnnouncementModalVisible(true)}
          >
            <Ionicons name="megaphone-outline" size={20} color="#fff" />
            <Text style={styles.announceText}>Announcement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifIcon}
            onPress={() => {
              markNotificationsAsRead();
              setChatModalVisible(true);
            }}
          >
            <Ionicons name="notifications-outline" size={26} color="#00BFA6" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => setActiveScreen("Profile")}
          >
            <View style={styles.avatarWrapper}>
              <Image source={require("../assets/profile.jpg")} style={styles.avatar} />
            </View>
            <Text style={styles.firstNameText}>{adminData.firstName || "Admin"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu-outline" size={28} color="#00BFA6" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>{renderScreen()}</View>

      {/* Announcement Modal */}
      <Modal
        visible={announcementModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAnnouncementModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Clinic Announcements</Text>

            <ScrollView style={{ maxHeight: 250 }}>
              {announcements.map((a) => (
                <View key={a.id} style={styles.announcementCard}>
                  <Text style={styles.announcementText}>{a.text}</Text>
                  {a.createdAt && (
                    <Text style={styles.dateText}>
                      {new Date(a.createdAt.seconds * 1000).toLocaleString()}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>

            <TextInput
              placeholder="Write new announcement..."
              style={styles.input}
              value={newAnnouncement}
              onChangeText={setNewAnnouncement}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.addButton} onPress={handleAddAnnouncement}>
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAnnouncementModalVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Threads & Appointments Modal (shows pending appointments at top + threads below) */}
      <Modal
        visible={chatModalVisible && !selectedThread}
        transparent
        animationType="slide"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Notifications</Text>

            {/* PENDING APPOINTMENTS */}
            <Text style={styles.sectionTitle}>Pending Appointments</Text>
            <ScrollView style={styles.appointmentList} contentContainerStyle={{ paddingBottom: 8 }}>
              {pendingAppointments.length > 0 ? (
                pendingAppointments.map((appt) => (
                  <TouchableOpacity
                    key={appt.id + "-" + appt.petName}
                    style={styles.appointmentItem}
                    onPress={() => setSelectedAppointment(appt)}
                  >
                    <Text style={styles.apptText}>
                      {appt.owner || appt.userName || "Unknown"} — {appt.petName || appt.service}
                    </Text>
                    <Text style={styles.apptSubText}>
                      {appt.date} {appt.time ? "• " + appt.time : ""}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No pending appointments.</Text>
              )}
            </ScrollView>

            {/* USER CHATS */}
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>User Chats</Text>
            <ScrollView style={styles.chatList} contentContainerStyle={{ paddingBottom: 20 }}>
              {threads.length > 0 ? (
                threads.map((t) => {
                  const unread = typeof t.unreadCount === "number"
                    ? t.unreadCount
                    : (t.lastSender === "user" && t.lastSeenByAdmin === false ? 1 : 0);

                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={styles.threadCard}
                      onPress={() => {
                        setSelectedThread(t);
                        setChatModalVisible(false);
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.threadName}>{t.userName || "User"}</Text>
                          <Text style={styles.threadPreview} numberOfLines={1}>
                            {t.lastMessage || "No messages yet"}
                          </Text>
                          <Text style={styles.threadDate}>
                            {t.updatedAt?.seconds ? new Date(t.updatedAt.seconds * 1000).toLocaleString() : ""}
                          </Text>
                        </View>
                        {unread > 0 && (
                          <View style={styles.threadBadge}>
                            <Text style={{ color: "#fff", fontWeight: "700" }}>{unread}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noThreadText}>No active chats</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setChatModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selected Thread Chat Modal (admin replies) */}
      <Modal
        visible={!!selectedThread}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedThread(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.chatBox}>
            <Text style={styles.modalTitle}>Chat — {selectedThread?.userName || "User"}</Text>

            <ScrollView style={styles.chatScroll} contentContainerStyle={{ paddingBottom: 20 }}>
              {messages.length > 0 ? (
                messages.map((m) => (
                  <View
                    key={m.id}
                    style={[
                      styles.chatBubble,
                      m.sender === "admin" ? styles.adminBubble : styles.userBubble,
                    ]}
                  >
                    <Text style={styles.msgText}>{m.message}</Text>
                    <Text style={styles.msgMeta}>
                      {m.sender === "admin" ? (adminData.firstName || "You") : (selectedThread?.userName || "User")}
                      {" • "}
                      {m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString() : ""}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyChat}>No messages yet</Text>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your reply..."
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendReply} disabled={sendingReply}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedThread(null)}
            >
              <Text style={styles.closeText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selected Appointment Details Modal */}
      <Modal
        visible={!!selectedAppointment}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedAppointment(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.detailBox}>
            <Text style={styles.detailTitle}>Appointment Details</Text>
            {selectedAppointment && (
              <>
                <Text style={styles.detailText}>
                  🐾 Pet: {selectedAppointment.petName || "N/A"}
                </Text>
                <Text style={styles.detailText}>
                  👤 Owner: {selectedAppointment.owner || selectedAppointment.userName || "N/A"}
                </Text>
                <Text style={styles.detailText}>
                  ✉️ Email: {selectedAppointment.email || selectedAppointment.owner || "N/A"}
                </Text>
                <Text style={styles.detailText}>
                  🗓 Date: {selectedAppointment.date || "N/A"}
                </Text>
                <Text style={styles.detailText}>
                  ⏰ Time: {selectedAppointment.time || "N/A"}
                </Text>
                <Text style={styles.detailText}>
                  💉 Service: {selectedAppointment.service || "N/A"}
                </Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#00BFA6" }]}
                    onPress={() => handleUpdateStatus("approved")}
                  >
                    <Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#FF4C4C" }]}
                    onPress={() => handleUpdateStatus("declined")}
                  >
                    <Text style={styles.actionText}>Decline</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setSelectedAppointment(null)}
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            {[
              { name: "Appointments", icon: "calendar-outline" },
              { name: "Reports", icon: "document-text-outline" },
              { name: "Profile", icon: "person-outline" },
            ].map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.menuItem,
                  activeScreen === item.name && styles.menuItemActive,
                ]}
                onPress={() => {
                  setActiveScreen(item.name);
                  setMenuVisible(false);
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={activeScreen === item.name ? "#fff" : "#00BFA6"}
                />
                <Text
                  style={[
                    styles.menuText,
                    activeScreen === item.name && styles.menuTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF4C4C" />
              <Text style={[styles.menuText, { color: "#FF4C4C" }]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Styles (kept similar to your previous file)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E0F7F4",
    padding: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  logo: { width: 50, height: 50, resizeMode: "contain" },
  logoText: { fontSize: 18, color: "#00BFA6", fontWeight: "600" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    color: "#00BFA6",
  },
  rightContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  announceButton: {
    flexDirection: "row",
    backgroundColor: "#00BFA6",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  announceText: { color: "#fff", fontWeight: "600", fontSize: 13, marginLeft: 4 },
  notifIcon: { position: "relative" },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF4C4C",
    borderRadius: 10,
    paddingHorizontal: 5,
    minWidth: 18,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00BFA6",
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#fff",
  },
  avatarWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#00BFA6",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0FFFC",
    marginRight: 6,
  },
  avatar: { width: 26, height: 26, borderRadius: 13 },
  firstNameText: { fontSize: 14, color: "#00BFA6", fontWeight: "600" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "90%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00BFA6",
    textAlign: "center",
    marginBottom: 10,
  },
  announcementCard: {
    backgroundColor: "#E0F7F4",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  notifCard: {
    backgroundColor: "#E0F7F4",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactCard: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  notifText: { fontWeight: "600", color: "#333" },
  notifTextSmall: { color: "#555", fontSize: 13 },
  noNotif: { textAlign: "center", color: "#888", fontStyle: "italic", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    backgroundColor: "#fff",
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  addButton: {
    backgroundColor: "#00BFA6",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  closeButton: {
    backgroundColor: "#FF4C4C",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  addText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  closeText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  body: { flex: 1 },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 10,
  },
  menuBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: 180,
    elevation: 5,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  menuItemActive: {
    backgroundColor: "#00BFA6",
  },
  menuText: {
    fontSize: 15,
    color: "#00BFA6",
    marginLeft: 10,
    fontWeight: "500",
  },
  menuTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },

  // appointments styles
  appointmentList: {
    maxHeight: 180,
    marginBottom: 10,
  },
  appointmentItem: {
    backgroundColor: "#E0F7F4",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  apptText: {
    fontWeight: "600",
    color: "#333",
  },
  apptSubText: {
    color: "#666",
    fontSize: 13,
  },

  // thread card & chat UI
  threadCard: {
    backgroundColor: "#F4FDFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  threadName: { fontWeight: "700", color: "#333", marginBottom: 2 },
  threadPreview: { color: "#555", fontSize: 13, marginBottom: 4 },
  threadDate: { color: "#888", fontSize: 12 },
  threadBadge: {
    backgroundColor: "#FF4C4C",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  noThreadText: { textAlign: "center", color: "#888", marginVertical: 20 },

  chatBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    width: "90%",
    maxHeight: "85%",
  },
  chatScroll: { flex: 1, marginBottom: 10 },
  chatBubble: {
    marginVertical: 6,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  adminBubble: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  userBubble: {
    backgroundColor: "#E0F7F4",
    alignSelf: "flex-start",
  },
  msgText: { color: "#333", fontSize: 14 },
  msgMeta: { fontSize: 11, color: "#666", marginTop: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  sendBtn: {
    backgroundColor: "#00BFA6",
    marginLeft: 8,
    padding: 10,
    borderRadius: 20,
  },
  closeBtn: {
    backgroundColor: "#00BFA6",
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  closeText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  emptyChat: { textAlign: "center", color: "#888", marginTop: 20 },

  // details modal
  detailBox: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    elevation: 6,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00BFA6",
    marginBottom: 10,
    textAlign: "center",
  },
  detailText: { fontSize: 15, color: "#333", marginBottom: 6 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionBtn: { flex: 1, marginHorizontal: 5, paddingVertical: 10, borderRadius: 8 },
  actionText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
