import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const { height } = Dimensions.get("window");

export default function GlobalOverlay({ visible, onPress, children }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-40)).current; // start slightly above
  

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Don’t render children if invisible (for better performance)
  if (!visible && fadeAnim.__getValue() === 0) return null;

  return (
    <Animated.View
      style={[
        styles.fullScreenContainer,
        { opacity: fadeAnim, pointerEvents: visible ? "auto" : "none" },
      ]}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      {/* Wrap children with animated slide */}
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // ensure it covers the whole screen
  },
  
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
});
