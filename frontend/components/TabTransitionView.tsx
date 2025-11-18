import React, { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (isFocused) {
      // reset before animating in
      translateX.setValue(30); // start slightly to the right
      opacity.setValue(0);

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
      ]).start();
    }
  }, [isFocused, translateX, opacity]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
