import { StyleSheet, Text, View } from 'react-native';

const TopNavigation = () => {
  return (
    <View style={styles.navContainer}>
      <Text style={styles.navTitle}>Appointment Management</Text>
      <Text style={styles.subTitle}>Schedule and manage pet appointments</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  subTitle: {
    fontSize: 12,
    color: '#666',
  },
});

export default TopNavigation;