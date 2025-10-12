import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome to <Text style={{color:'#00BFA6'}}>VetPlus</Text></Text>
      <Text style={styles.subtitle}>Caring for your pets made easy</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  logo: { width: 150, height: 150, marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 30 },
  button: {
    backgroundColor: '#00BFA6',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 30
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
