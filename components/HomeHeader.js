import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

const { width } = Dimensions.get("window");

export default function HomeHeader({
  onProfilePress,
  onNotificationPress,
  onGlobalMenuToggle, // ✅ add this
  isProfileScreen,
}) {

  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const menuButtonRef = useRef(null);

  // Measure hamburger icon position to drop menu under it
  const toggleMenu = () => {
  if (!menuVisible) {
    // measure position of the menu button
    menuButtonRef.current?.measureInWindow((x, y, w, h) => {
      const position = { top: y + h + 8, right: 10 }; // adjust right offset if needed
      setMenuVisible(true);
      onGlobalMenuToggle?.({ visible: true, position }); // ✅ tell App.js to show overlay
    });
  } else {
    setMenuVisible(false);
    onGlobalMenuToggle?.({ visible: false }); // ✅ hide overlay
  }
};


  const handleNavigation = (route) => {
    setMenuVisible(false);
    setTimeout(() => {
      if (route === "Logout") navigation.navigate("Login");
      else navigation.navigate(route);
    }, 200);
  };

  return (
    <>
      {/* Header */}
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

          <TouchableOpacity
            ref={menuButtonRef}
            onPress={toggleMenu}
            style={styles.iconBtn}
          >
            <Ionicons name="menu-outline" size={26} color="#00BFA6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen dark overlay + dropdown under icon */}
    {/* {menuVisible && (
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.menuContainer,
            { top: menuPosition.top, right: menuPosition.right },
          ]}
        >
          {[
            { name: "About Us", route: "AboutUs" },
            { name: "Contact Us", route: "ContactUs" },
            { name: "Logout", route: "Logout" },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.name === "Logout" && {
                  borderTopWidth: 1,
                  borderTopColor: "#eee",
                },
              ]}
              onPress={() => handleNavigation(item.route)}
            >
              <Text
                style={[
                  styles.menuText,
                  item.name === "Logout" && { color: "red" },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
            </View>
          </View>
    )} */}

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
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 1000,
  },

  menuContainer: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    width: width * 0.45,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignItems: "center",
  },
  menuItem: {
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
});
