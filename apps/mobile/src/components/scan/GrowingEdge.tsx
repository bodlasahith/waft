import React, { useEffect } from "react";
import Svg, { Line } from "react-native-svg";
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withDelay,
    withTiming,
} from "react-native-reanimated";

const AnimatedLine = Animated.createAnimatedComponent(Line);

interface Props {

    width: number;

    delay?: number;

    color?: string;
}

export default function GrowingEdge({

    width,

    delay = 0,

    color = "#6E7DFF",

}: Props) {

    const progress = useSharedValue(0);

    useEffect(() => {

        progress.value = withDelay(

            delay,

            withTiming(1, {

                duration: 450,

            })

        );

    }, []);

    const animatedProps = useAnimatedProps(() => ({

        x2: width * progress.value,

    }));

    return (

        <Svg

            width={width}

            height={8}

        >

            <AnimatedLine

                animatedProps={animatedProps}

                x1={0}

                y1={4}

                x2={0}

                y2={4}

                stroke={color}

                strokeWidth={4}

                strokeLinecap="round"

            />

        </Svg>

    );

}