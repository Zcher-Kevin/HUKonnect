import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from "react-native";
import { Audio } from "expo-av";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  playSound?: boolean;
};

let clickSound: Audio.Sound | null = null;

async function playClick() {
  try {
    if (!clickSound) {
      clickSound = new Audio.Sound();
      await clickSound.loadAsync(
        require("../assets/sounds/tap.mp3")
      );
    }
    await clickSound.replayAsync();
  } catch {
    // fail silently because the sound is purely cosmetic
  }
}

export function BouncyButton({
  children,
  style,
  disabled,
  onPress,
  playSound = true,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();
  };

  const handlePressIn = () => {
    if (!disabled) animateTo(0.96);
  };

  const handlePressOut = () => {
    animateTo(1);
  };

  const handlePress = async (e: GestureResponderEvent) => {
    if (disabled || !onPress) return;
    if (playSound) {
      await playClick();
    }
    await onPress(e);
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      android_ripple={{ color: "rgba(0,0,0,0.05)" }}
      style={{ borderRadius: 999 }}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
