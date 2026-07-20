import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from "react-native";
import { colors, radii } from "../theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "ghost" | "danger";
}

/** Replaces RN's bare <Button>: themed, with a press-scale spring. */
export function AppButton({ title, onPress, disabled, busy, variant = "primary" }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = (to: number) =>
    Animated.spring(scale, { toValue: to, friction: 5, useNativeDriver: true }).start();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      onPressIn={() => press(0.96)}
      onPressOut={() => press(1)}
    >
      <Animated.View
        style={[
          styles.base,
          variant === "primary" && styles.primary,
          variant === "ghost" && styles.ghost,
          variant === "danger" && styles.danger,
          (disabled || busy) && styles.disabled,
          { transform: [{ scale }] },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={variant === "primary" ? "#fff" : colors.accent} />
        ) : (
          <Text
            style={[
              styles.label,
              variant === "ghost" && { color: colors.accent },
              variant === "danger" && { color: colors.danger },
            ]}
          >
            {title}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primary: { backgroundColor: colors.accent },
  ghost: { backgroundColor: colors.accentSoft },
  danger: { backgroundColor: "rgba(255,107,107,0.14)" },
  disabled: { opacity: 0.45 },
  label: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
