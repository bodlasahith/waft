import { useMemo } from "react";
import Svg, { Circle, Line } from "react-native-svg";
import { StyleSheet, ViewStyle } from "react-native";
import { qrTheme } from "./qrTheme";
import Animated, { AnimatedStyle } from 'react-native-reanimated';

interface Props {
    seed: string;
    width: number;
    height: number;
    color?: string;
    style?: AnimatedStyle<ViewStyle>;
}

interface Node {
    x: number;
    y: number;
}

function hash(str: string) {
    let h = 1779033703;

    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }

    return h >>> 0;
}

function mulberry32(a: number) {
    return function () {
        a |= 0;

        a = (a + 0x6d2b79f5) | 0;

        let t = Math.imul(a ^ (a >>> 15), 1 | a);

        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function GraphBackground({
    seed,
    width,
    height,
    color = "#6E7DFF",
    style
}: Props) {

    const { nodes, edges } = useMemo(() => {
        const random = mulberry32(hash(seed));

        const nodes: Node[] = [];

        for (let i = 0; i < 18; i++) {
            nodes.push({
                x: random() * width,
                y: random() * height,
            });
        }

        const edges: [number, number][] = [];

        for (let i = 0; i < nodes.length; i++) {
            let nearest = -1;
            let nearestDistance = Infinity;
            let secondNearest = -1;
            let secondNearestDistance = Infinity;

            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;

                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;

                const d = dx * dx + dy * dy;

                if (d < nearestDistance) {
                    secondNearestDistance = nearestDistance;
                    secondNearest = nearest;
                    nearestDistance = d;
                    nearest = j;
                } else if (d < secondNearestDistance) {
                    secondNearestDistance = d;
                    secondNearest = j;
                }
            }

            if (nearest >= 0) {
                edges.push([i, nearest]);
            }

            if (secondNearest >= 0) {
                edges.push([i, secondNearest]);
            }
        }

        return { nodes, edges };
    }, [seed, width, height]);

    return (
        <Animated.View
            style={[
                StyleSheet.absoluteFill,
                style,
            ]}
        >
            <Svg
                width={width}
                height={height}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            >
                {edges.map(([a, b], index) => (
                    <Line
                        key={index}
                        x1={nodes[a].x}
                        y1={nodes[a].y}
                        x2={nodes[b].x}
                        y2={nodes[b].y}
                        stroke={color}
                        strokeOpacity={qrTheme.graph.edgeOpacity}
                        strokeWidth={1}
                    />
                ))}

                {nodes.map((node, index) => (
                    <Circle
                        key={index}
                        cx={node.x}
                        cy={node.y}
                        r={qrTheme.graph.nodeRadius}
                        fill={color}
                        fillOpacity={qrTheme.graph.nodeOpacity}
                    />
                ))}
            </Svg>
        </Animated.View>
    );
}