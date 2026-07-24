import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";

import Svg from "react-native-svg";

import { AvatarNode } from "../AvatarNode";

interface Props {

  visible: boolean;

  profile: {
    name: string;

    avatar?: {
      color?: string;
      shape?: string;
    };

    socials: number;
  };

  icebreaker?: string;

  onDone: () => void;

  onViewProfile?: () => void;
}

export default function ProfilePreview({

  visible,

  profile,

  icebreaker,

  onDone,

  onViewProfile,

}: Props) {

  const translate = useSharedValue(120);

  useEffect(() => {

    if (!visible) return;

    translate.value = withDelay(
      1400,
      withSpring(0, {
        damping: 14,
        stiffness: 170,
      })
    );

  }, [visible]);

  const style = useAnimatedStyle(() => ({

    transform: [
      {
        translateY: translate.value,
      },
    ],

    opacity: 1 - translate.value / 120,

  }));

  if (!visible) return null;

  return (

    <Animated.View style={[styles.sheet, style]}>

      <View style={styles.handle} />

      <Svg
        width={70}
        height={70}
      >

        <AvatarNode
          x={35}
          y={35}
          r={26}
          color={profile.avatar?.color ?? "#6E7DFF"}
          shape={profile.avatar?.shape}
          initial={profile.name.charAt(0)}
        />

      </Svg>

      <Text style={styles.name}>

        {profile.name}

      </Text>

      <Text style={styles.subtitle}>

        {profile.socials} linked platforms

      </Text>

      {icebreaker && (

        <View style={styles.icebreaker}>

          <Text style={styles.icebreakerLabel}>

            Conversation Starter

          </Text>

          <Text style={styles.icebreakerText}>

            {icebreaker}

          </Text>

        </View>

      )}

      <View style={styles.buttons}>

        {onViewProfile && (

          <Pressable
            style={styles.primary}
            onPress={onViewProfile}
          >

            <Text style={styles.primaryText}>

              View Profile

            </Text>

          </Pressable>

        )}

        <Pressable
          style={styles.secondary}
          onPress={onDone}
        >

          <Text style={styles.secondaryText}>

            Scan Again

          </Text>

        </Pressable>

      </View>

    </Animated.View>

  );

}

const styles = StyleSheet.create({

  sheet: {

    position: "absolute",

    left: 20,

    right: 20,

    bottom: 30,

    borderRadius: 28,

    backgroundColor: "rgba(18,24,38,.96)",

    padding: 24,

    alignItems: "center",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,.08)",

  },

  handle: {

    width: 42,

    height: 5,

    borderRadius: 3,

    backgroundColor: "rgba(255,255,255,.15)",

    marginBottom: 18,

  },

  name: {

    color: "white",

    fontWeight: "700",

    fontSize: 24,

    marginTop: 12,

  },

  subtitle: {

    color: "#A7B3D1",

    marginTop: 6,

  },

  icebreaker: {

    marginTop: 22,

    width: "100%",

    padding: 18,

    borderRadius: 18,

    backgroundColor: "rgba(255,255,255,.04)",

  },

  icebreakerLabel: {

    color: "#7E91FF",

    fontWeight: "700",

    fontSize: 12,

    letterSpacing: 1,

    textTransform: "uppercase",

  },

  icebreakerText: {

    color: "white",

    marginTop: 10,

    lineHeight: 24,

    fontSize: 16,

  },

  buttons: {

    marginTop: 22,

    flexDirection: "row",

    gap: 12,

  },

  primary: {

    backgroundColor: "#6E7DFF",

    paddingHorizontal: 24,

    paddingVertical: 14,

    borderRadius: 14,

  },

  secondary: {

    backgroundColor: "rgba(255,255,255,.05)",

    paddingHorizontal: 24,

    paddingVertical: 14,

    borderRadius: 14,

  },

  primaryText: {

    color: "white",

    fontWeight: "700",

  },

  secondaryText: {

    color: "white",

    fontWeight: "600",

  },

});