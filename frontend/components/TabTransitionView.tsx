import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";
import { useIsFocused } from "@react-navigation/native";

type Props = {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * TabTransitionView is an animation wrapper for
 * smooth transition between main tabs
 */
export function TabTransitionView({ style, children }: Props) {
  const isFocused = useIsFocused();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  // Track whether an animation is currently running so we can temporarily
  // disable elevation/shadows which can render as dark artefacts during
  // Android compositing while animating transforms.
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isFocused) {
      // reset before animating in
      translateX.setValue(30); // start slightly to the right
      opacity.setValue(0);

      setIsAnimating(true);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // animation finished
        setIsAnimating(false);
      });
    }
  }, [isFocused, translateX, opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX }],
          opacity,
          // Use transparent background to avoid exposing a black default
          // background while animating, and temporarily remove elevation
          // to avoid Android shadow artefacts during the transform.
          backgroundColor: "transparent",
          elevation: isAnimating ? 0 : undefined,
          shadowOpacity: isAnimating ? 0 : undefined,
        },
      ]}
      // Improve rendering while animating on Android / iOS
      renderToHardwareTextureAndroid={true}
      shouldRasterizeIOS={true}
    >
      {children}
    </Animated.View>
  );
}
