import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function AboutUs() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.card}>
        <Text style={styles.title}>About VetPlus Animal Clinic</Text>

        <Text style={styles.paragraph}>
          At VetPlus Animal Clinic, we believe that pets are family — and they
          deserve nothing less than compassionate, expert care. Located in the
          heart of Cabanatuan City, our clinic is dedicated to providing
          comprehensive veterinary services that prioritize your pet’s health,
          comfort, and happiness.
        </Text>

        <Text style={styles.sectionTitle}>🩺 Our Mission</Text>
        <Text style={styles.paragraph}>
          To deliver high-quality veterinary care with integrity, empathy, and
          professionalism, ensuring every pet receives the attention they
          deserve and every owner feels confident and supported.
        </Text>

        <Text style={styles.sectionTitle}>🐶 What We Offer</Text>
        <View style={styles.listBox}>
          <Text style={styles.item}>• Check-up</Text>
          <Text style={styles.item}>• Treatment</Text>
          <Text style={styles.item}>• Diagnostics (Ultrasound, X-ray)</Text>
          <Text style={styles.item}>• Laser Therapy</Text>
          <Text style={styles.item}>• Surgery (Major & Minor)</Text>
          <Text style={styles.item}>• Vaccination & Deworming</Text>
          <Text style={styles.item}>• Grooming & Confinement</Text>
        </View>

        <Text style={styles.sectionTitle}>👩‍⚕️ Our Team</Text>
        <Text style={styles.paragraph}>
          Our licensed veterinarians and dedicated staff are passionate animal
          lovers. With years of experience, they stay up-to-date with the latest
          veterinary practices and technology to ensure your pet receives the
          best care possible.
        </Text>

        <Text style={styles.sectionTitle}>🏥 Why Choose Us?</Text>
        <View style={styles.listBox}>
          <Text style={styles.item}>• Warm, welcoming environment</Text>
          <Text style={styles.item}>• Personalized care for every pet</Text>
          <Text style={styles.item}>• Transparent communication</Text>
          <Text style={styles.item}>• Modern facilities and tools</Text>
          <Text style={styles.item}>• Easy appointment scheduling</Text>
        </View>

        <Text style={styles.sectionTitle}>📱 Connect With Us</Text>
        <Text style={styles.paragraph}>
          Whether you’re a first-time pet parent or a long-time animal lover,
          VetPlus Animal Clinic is here to support you. Visit us or contact us
          through the VetPlus app to book appointments and track your pet’s
          health easily.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#00BFA6",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00BFA6",
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    textAlign: "justify",
  },
  listBox: { marginLeft: 10, marginTop: 4 },
  item: { fontSize: 14, color: "#333", marginBottom: 4 },
});
