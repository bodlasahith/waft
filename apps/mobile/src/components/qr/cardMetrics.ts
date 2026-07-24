import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

export function useCardMetrics() {
    const { width } = useWindowDimensions();

    return useMemo(() => {

        const cardWidth = Math.min(width - 32, 390);

        const aspectRatio = 1.45;

        const cardHeight = cardWidth * aspectRatio;

        return {

            cardWidth,

            cardHeight,

            borderRadius: cardWidth * 0.08,

            padding: cardWidth * 0.075,

            qrSize: cardWidth * 0.60,

            qrPadding: cardWidth * 0.05,

            avatarSize: cardWidth * 0.14,

            avatarRadius: cardWidth * 0.055,

            glowSize: cardWidth * 1.15,

            titleSize: cardWidth * 0.052,

            bodySize: cardWidth * 0.037,

            nameSize: cardWidth * 0.072,

            footerSize: cardWidth * 0.037,

            graphWidth: cardWidth,

            graphHeight: cardHeight,

            cornerPadding: cardWidth * 0.08,

        };

    }, [width]);

}