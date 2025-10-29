// AboutUs.js
import { ScrollView, StyleSheet, Text } from "react-native";

export default function AboutUs() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>About VetPlus Animal Clinic</Text>

      <Text style={styles.paragraph}>
        At VetPlus Animal Clinic, we believe that pets are family — and they deserve nothing less than compassionate, expert care.
        Located in the heart of Cabanatuan City, our clinic is dedicated to providing comprehensive veterinary services that prioritize your pet’s health, comfort, and happiness.
      </Text>

      <Text style={styles.sectionTitle}>🩺 Our Mission</Text>
      <Text style={styles.paragraph}>
        To deliver high-quality veterinary care with integrity, empathy, and professionalism, ensuring every pet receives the attention they deserve and every owner feels confident and supported.
      </Text>

      <Text style={styles.sectionTitle}>🐶 What We Offer</Text>
      <Text style={styles.item}>• Check-up</Text>
      <Text style={styles.item}>• Treatment</Text>
      <Text style={styles.item}>• Diagnostics</Text>
      <Text style={styles.item}>  – Ultrasound</Text>
      <Text style={styles.item}>  – X-ray</Text>
      <Text style={styles.item}>• Laser Therapy</Text>
      <Text style={styles.item}>• Major and Minor Surgery</Text>
      <Text style={styles.item}>• Vaccination</Text>
      <Text style={styles.item}>• Deworming</Text>
      <Text style={styles.item}>• Grooming</Text>
      <Text style={styles.item}>• Confinement</Text>

      <Text style={styles.sectionTitle}>👩‍⚕️ Our Team</Text>
      <Text style={styles.paragraph}>
        Our team of licensed veterinarians and trained staff are passionate animal lovers with years of experience in small animal care. We stay up-to-date with the latest veterinary practices and technologies to ensure your pet receives the best possible treatment.
      </Text>

      <Text style={styles.sectionTitle}>🏥 Why Choose Us?</Text>
      <Text style={styles.paragraph}>
        • Warm, welcoming environment{"\n"}
        • Personalized care for every pet{"\n"}
        • Transparent communication with pet owners{"\n"}
        • Modern facilities and equipment{"\n"}
        • Convenient appointment scheduling
      </Text>

      <Text style={styles.sectionTitle}>📱 Connect With Us</Text>
      <Text style={styles.paragraph}>
        Whether you're a first-time pet parent or a long-time animal lover, VetPlus Animal Clinic is here to support your journey. Visit us in person or reach out through our app to book appointments, access pet records, and stay updated on your pet’s health.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#00BFA6", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  paragraph: { fontSize: 14, color: "#333", lineHeight: 20 },
  item: { fontSize: 14, marginLeft: 6, color: "#333", marginBottom: 4 },
});
