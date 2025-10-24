import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeHeader({
  onProfilePress,
  onNotificationPress,
  onMenuPress,
  isProfileScreen = false,
}) {
  return (
    <View style={styles.headerContainer}>
      {!isProfileScreen && (
        <TouchableOpacity onPress={onProfilePress}>
          <Image
            source={require("../assets/profile.jpg")}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      )}

      <Image
        source={require("../assets/logotext.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.rightIcons}>
        <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color="#00BFA6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
          <Ionicons name="menu-outline" size={26} color="#00BFA6" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f4f4f4",
  },
  logo: {
    width: 110,
    height: 35,
    marginLeft: 30,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    marginLeft: 12,
  },
});