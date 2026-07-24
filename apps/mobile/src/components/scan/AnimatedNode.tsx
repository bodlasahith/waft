import React, { useEffect } from "react";
import Svg from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDelay,
    withSpring,
} from "react-native-reanimated";

import { AvatarNode } from "../AvatarNode";

interface Props {
    color: string;
    shape?: string;
    initial: string;

    delay?: number;
}

export default function AnimatedNode({
    color,
    shape,
    initial,
    delay = 0,
}: Props) {

    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            delay,
            withSpring(1, {
                damping: 12,
                stiffness: 180,
            })
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value }
        ],
        opacity: scale.value,
    }));

    return (
        <Animated.View style={style}>
            <Svg
                width={78}
                height={78}
            >
                <AvatarNode
                    x={39}
                    y={39}
                    r={28}
                    color={color}
                    shape={shape}
                    initial={initial}
                />
            </Svg>
        </Animated.View>
    );
}