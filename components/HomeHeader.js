import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function HomeHeader({
  onProfilePress,
  onNotificationPress,
  isProfileScreen = false,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current; // for slide-in animation

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <>
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

          <TouchableOpacity onPress={toggleMenu} style={styles.iconBtn}>
            <Ionicons name="menu-outline" size={26} color="#00BFA6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-screen overlay and side menu */}
      {menuVisible && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableWithoutFeedback onPress={toggleMenu}>
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.menuContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {["About Us", "Contact Us", "Logout"].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  console.log(item);
                  toggleMenu();
                }}
              >
                <Text style={styles.menuText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      )}
    </>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    position: "absolute",
    top: 100,
    right: 20,
    width: width * 0.5,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingVertical: 20,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: 15,
    width: "100%",
    alignItems: "center",
  },
  menuText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "500",
  },
});
