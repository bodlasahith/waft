import React from "react";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

interface Props {

    visible: boolean;

    children: React.ReactNode;

}

export default function ScanOverlay({

    visible,

    children,

}: Props) {

    if (!visible) return null;

    return (

        <BlurView

            intensity={60}

            tint="dark"

            style={styles.overlay}

        >

            {children}

        </BlurView>

    );

}

const styles = StyleSheet.create({

    overlay: {

        ...StyleSheet.absoluteFill,

        justifyContent: "center",

        alignItems: "center",

        backgroundColor: "rgba(5,8,15,.28)",

    },

});