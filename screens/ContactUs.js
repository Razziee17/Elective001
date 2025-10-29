// ContactUs.js (keyboard adaptive + floating scroll button)
import { Ionicons } from "@expo/vector-icons";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase";


export default function ContactUs() {
  const user = auth.currentUser;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [userName, setUserName] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load user's profile name
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) setUserName(snap.data().firstName || "User");
      } catch (err) {
        console.error("Failed to load user data:", err);
      }
    };
    loadUserData();
  }, [user]);

  // Ensure thread document exists
  const ensureThreadExists = async () => {
    if (!user) return null;
    const threadRef = doc(db, "contact_threads", user.uid);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) {
      await setDoc(threadRef, {
        userId: user.uid,
        userName: userName || "User",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSender: "user",
        lastMessage: "",
        unreadCount: 0,
        lastSeenByAdmin: true,
      });
    }
    return threadRef;
  };

  // Listen to messages
  useEffect(() => {
    if (!user) return;
    const messagesRef = collection(db, "contact_threads", user.uid, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(list);

      // mark unseen admin messages as seenByUser
      snapshot.docs.forEach(async (d) => {
        const data = d.data();
        if (data.sender === "admin" && data.seenByUser !== true) {
          try {
            const msgRef = doc(db, "contact_threads", user.uid, "messages", d.id);
            await updateDoc(msgRef, { seenByUser: true });
          } catch (err) {
            console.error("Failed to update seenByUser:", err);
          }
        }
      });

      // auto-scroll to bottom when new messages arrive
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    });
    return unsubscribe;
  }, [user]);

  // Send message
  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      const threadRef = await ensureThreadExists();
      const messagesRef = collection(threadRef, "messages");

      await addDoc(messagesRef, {
        sender: "user",
        message: message.trim(),
        createdAt: serverTimestamp(),
        seenByUser: true,
        seenByAdmin: false,
      });

      await updateDoc(threadRef, {
        lastMessage: message.trim(),
        lastSender: "user",
        updatedAt: serverTimestamp(),
        lastSeenByAdmin: false,
        unreadCount: 1,
      });

      setMessage("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  // Show/hide scroll-to-bottom button based on scroll position
  const handleScroll = (e) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;

    if (isAtBottom && showScrollButton) {
      setShowScrollButton(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (!isAtBottom && !showScrollButton) {
      setShowScrollButton(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* 🟢 Contact Card */}
          <View style={styles.contactCard}>
            <Text style={styles.title}>Contact Us</Text>
            <Text style={styles.subtitle}>We’re always happy to help!</Text>

            {/* Email */}
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={20} color="#00BFA6" />
              <TouchableOpacity
                onPress={() => Linking.openURL("mailto:vetplusanimalclinic2018@gmail.com")}
              >
                <Text style={styles.contactText}>Send us email.</Text>
              </TouchableOpacity>
            </View>

            {/* Facebook */}
            <View style={styles.contactRow}>
              <Ionicons name="logo-facebook" size={20} color="#00BFA6" />
              <TouchableOpacity
                onPress={() => Linking.openURL("https://www.facebook.com/share/1D1cTEbsiE/")}
              >
                <Text style={styles.contactText}>Visit our Facebook Page, Click me!</Text>
              </TouchableOpacity>
            </View>

            {/* Hotline */}
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={20} color="#00BFA6" />
              <Text style={styles.contactText}>0955 771 0460</Text>
            </View>

            {/* Address */}
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={20} color="#00BFA6" />
              <Text style={styles.contactText}>
                National Road Brgy Lourdes, Cabanatuan City, Philippines, 3100
              </Text>
            </View>

            {/* Hours */}
            <View style={styles.contactRow}>
              <Ionicons name="time-outline" size={20} color="#00BFA6" />
              <Text style={styles.contactText}>Daily, 8am to 4:00pm</Text>
            </View>

            
          </View>


          {/* 💬 Chat Section */}
          <View style={{ marginTop: 20 }}>
            {messages.length > 0 ? (
              messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.sender === "user" ? styles.userBubble : styles.adminBubble,
                  ]}
                >
                  <Text style={styles.msgText}>{m.message}</Text>
                  <Text style={styles.metaText}>
                    {m.sender === "user" ? "You" : "Admin"} •{" "}
                    {m.createdAt
                      ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString()
                      : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No messages yet. Say hi! 👋</Text>
            )}
          </View>
        </ScrollView>

        {/* Floating scroll-to-bottom button */}
        {showScrollButton && (
          <Animated.View style={[styles.scrollButton, { opacity: fadeAnim }]}>
            <TouchableOpacity
              onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              <Ionicons name="arrow-down-circle" size={40} color="#00BFA6" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Input field */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Let us know your concern..."
            value={message}
            onChangeText={setMessage}
            multiline
            onFocus={() =>
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200)
            }
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && { opacity: 0.6 }]}
            onPress={handleSendMessage}
            disabled={sending}
          >
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 15,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00BFA6",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#555",
    textAlign: "center",
    marginBottom: 14,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  contactText: {
    color: "#333",
    fontSize: 14,
    marginLeft: 10,
    flexShrink: 1,
  },
  // Existing chat styles (keep unchanged)
  bubble: {
    marginVertical: 6,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#E0F7F4",
    alignSelf: "flex-end",
  },
  adminBubble: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-start",
  },
  msgText: { color: "#333", fontSize: 14 },
  metaText: { color: "#666", fontSize: 11, marginTop: 3 },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#00BFA6",
    borderRadius: 25,
    padding: 10,
    marginLeft: 8,
  },
  scrollButton: {
    position: "absolute",
    right: 20,
    bottom: 80,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },
});
