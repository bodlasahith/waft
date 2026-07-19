import { Circle, G, Polygon, Rect, Text as SvgText } from "react-native-svg";

interface Props {
  x: number;
  y: number;
  r: number;
  color: string;
  shape?: string | null;
  initial?: string;
  onPress?: () => void;
}

/**
 * A person's node in any graph rendering: their avatar shape/color with
 * their initial. Renders inside an <Svg> element.
 */
export function AvatarNode({ x, y, r, color, shape, initial, onPress }: Props) {
  const s = shape ?? "circle";
  return (
    <G onPress={onPress}>
      {s === "square" && (
        <Rect x={x - r} y={y - r} width={r * 2} height={r * 2} rx={r * 0.25} fill={color} />
      )}
      {s === "diamond" && (
        <Polygon
          points={`${x},${y - r * 1.15} ${x + r * 1.15},${y} ${x},${y + r * 1.15} ${x - r * 1.15},${y}`}
          fill={color}
        />
      )}
      {s === "hexagon" && (
        <Polygon
          points={Array.from({ length: 6 }, (_, i) => {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            return `${x + r * 1.08 * Math.cos(a)},${y + r * 1.08 * Math.sin(a)}`;
          }).join(" ")}
          fill={color}
        />
      )}
      {s === "circle" && <Circle cx={x} cy={y} r={r} fill={color} />}
      {initial && (
        <SvgText
          x={x}
          y={y + r * 0.28}
          fontSize={r * 0.8}
          fontWeight="bold"
          fill="#fff"
          textAnchor="middle"
        >
          {initial}
        </SvgText>
      )}
    </G>
  );
}
