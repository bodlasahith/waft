import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated from 'react-native-reanimated';
import Svg from "react-native-svg";

import type { MyProfile } from "../../api";
import { CARD_ORIGIN } from "../../config";
import { colors } from "../../theme";
import { AvatarNode } from "../AvatarNode";

import { StyledQRCode } from "./StyledQRCode";
import { GraphBackground } from "./GraphBackground";
import { CardGlow } from "./CardGlow";
import { AnimatedGradient } from "./AnimatedGradient";
import { GlassOverlay } from "./GlassOverlay";
import { SpecularHighlight } from "./SpecularHighlight";
import { AmbientParticles } from "./AmbientParticles";

import { useCardAnimation } from "./useCardAnimation";
import { useCardMetrics } from "./cardMetrics";

const metrics = useCardMetrics();

function StyledAvatar({
    profile,
}: {
    profile: MyProfile;
}) {
    return (
        <Svg
            width={54}
            height={54}
        >
            <AvatarNode
                x={27}
                y={27}
                r={20}
                color={
                    profile.avatar?.color ??
                    "#6E7DFF"
                }
                shape={profile.avatar?.shape}
                initial={profile.name[0]}
            />
        </Svg>
    );
}

interface Props {
    profile: MyProfile;

    onEditAvatar: () => void;
    onEditSocials: () => void;
}

export function QRCard({
    profile,
    onEditAvatar,
    onEditSocials,
}: Props) {
    const anim = useCardAnimation();

    const styles = StyleSheet.create({
        backgroundLayers: {
            ...StyleSheet.absoluteFill,
        },

        container: {
            width: "100%",
            alignItems: "center",
        },

        glow: {
            position: "absolute",

            width: metrics.graphWidth,

            height: metrics.graphHeight,

            borderRadius: 180,

            backgroundColor: "#6C7CFF22",

            transform: [
                {
                    scale: 1.25
                }
            ]
        },

        card: {

            width: "100%",

            maxWidth: metrics.cardWidth,

            borderRadius: metrics.borderRadius,

            overflow: "hidden",

            padding: metrics.padding,

            borderWidth: 1,

            borderColor: "rgba(255,255,255,.06)",

        },

        content: {

            position: "relative",

            zIndex: 10,

        },

        header: {

            flexDirection: "row",

            alignItems: "center",

            marginBottom: 30,

        },

        avatarWrapper: {

            marginRight: 16,

        },

        name: {

            color: "white",

            fontWeight: "700",

            fontSize: metrics.nameSize,

        },

        subtitle: {

            color: "#A9B2C9",

            marginTop: 2,

        },

        title: {

            color: "white",

            textAlign: "center",

            fontWeight: "700",

            fontSize: metrics.titleSize,

        },

        body: {

            color: "#AEB7CB",

            marginTop: 10,

            textAlign: "center",

            lineHeight: 22,

        },

        footer: {

            marginTop: 28,

            flexDirection: "row",

            justifyContent: "space-between",

            fontSize: metrics.footerSize

        },

        link: {

            color: colors.accent,

            fontWeight: "600",

        },

        qrTile: {
            backgroundColor: "white",

            padding: 16,

            borderRadius: 20,

            alignSelf: "center",

            marginBottom: 20,

            elevation: 10,

            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 10,
            },
            shadowOpacity: 0.31,
            shadowRadius: 10.0,

            zIndex: 1,

            transform: [
                {
                    scale: 1,
                }
            ],

            borderWidth: 1,
            borderColor: "rgba(0,0,0,.03)"
        }

    });

    return (
        <Animated.View style={anim.cardStyle}>
            {/* card */}

            <Animated.View style={[
                    styles.card,
                    anim.cardMaterialStyle,
                ]}>
                <View style={styles.backgroundLayers}>
                    <AnimatedGradient />
                    <AmbientParticles
                        width={metrics.cardWidth}
                        height={metrics.cardHeight}
                        seed={profile.card_code}
                    />
                    <GraphBackground
                        seed={profile.card_code}
                        width={metrics.graphWidth}
                        height={metrics.graphHeight}
                        color={profile.avatar?.color}
                        style={anim.graphStyle}
                    />
                    <CardGlow
                        color={profile.avatar?.color ?? "#6E7DFF"}
                        style={anim.glowStyle}
                    />

                    {/* soft glow */}
                    <GlassOverlay />
                    <SpecularHighlight style={anim.specularStyle} color={profile.avatar?.color} />
                </View>

                <View style={styles.content}>
                    {/* Header */}

                    <Pressable
                        style={styles.header}
                        onPress={onEditAvatar}
                    >
                        <View style={styles.avatarWrapper}>
                            <StyledAvatar profile={profile} />
                        </View>

                        <View>

                            <Text style={styles.name}>
                                {profile.name}
                            </Text>

                            <Text style={styles.subtitle}>
                                Your Waft identity
                            </Text>

                        </View>

                    </Pressable>

                    {/* QR */}

                    <Animated.View
                        style={[
                            styles.qrTile,
                            anim.qrStyle,
                        ]}
                    >

                        <StyledQRCode
                            value={`${CARD_ORIGIN}/c/${profile.card_code}`}
                            initial={profile.name.charAt(0)}
                            avatar={profile.avatar}
                        />

                    </Animated.View>

                    {/* Description */}

                    <Text style={styles.title}>
                        Scan to connect instantly
                    </Text>

                    <Text style={styles.body}>
                        Share your verified social graph
                        with one scan.
                    </Text>

                    {/* Footer */}

                    <View style={styles.footer}>

                        <Pressable
                            onPress={onEditSocials}
                        >
                            <Text style={styles.link}>

                                {profile.social_links.length}
                                {" "}
                                linked profiles

                            </Text>

                        </Pressable>

                        <Pressable
                            onPress={onEditAvatar}
                        >

                            <Text style={styles.link}>
                                Customize node
                            </Text>

                        </Pressable>

                    </View>
                </View>

            </Animated.View>



        </Animated.View>
    );
}