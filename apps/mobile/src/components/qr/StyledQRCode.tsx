import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import Svg from "react-native-svg";

import { AvatarNode } from "../AvatarNode";
import { qrTheme } from "./qrTheme";
import { useCardMetrics } from "./cardMetrics";

interface Avatar {
  color?: string;
  shape?: string;
}

interface Props {
  value: string;
  initial: string;
  avatar?: Avatar | null;
}

export function StyledQRCode({
  value,
  initial,
  avatar,
}: Props) {
  const metrics = useCardMetrics();

  const styles = StyleSheet.create({

    wrapper: {

      width: qrTheme.qr.size,

      height: qrTheme.qr.size,

      alignItems: "center",

      justifyContent: "center",
    },

    centerNode: {

      position: "absolute",

      width: 56,

      height: 56,

      borderRadius: 28,

      backgroundColor: qrTheme.qr.background,

      alignItems: "center",

      justifyContent: "center",

      borderWidth: 5,

      borderColor: qrTheme.qr.background,

      shadowColor: "#000",

      shadowOpacity: .12,

      shadowRadius: 10,

      shadowOffset: {

        width: 0,

        height: 4,

      },
    },

  });

  return (
    <View style={styles.wrapper}>
      <QRCode
        value={value}
        size={qrTheme.qr.size}
        ecl="H"
        color="#111827"
        backgroundColor="transparent"
      />

      <View style={styles.centerNode}>
        <Svg width={42} height={42}>
          <AvatarNode
            x={21}
            y={21}
            r={16}
            initial={initial}
            color={avatar?.color ?? "#6D7DFF"}
            shape={avatar?.shape}
          />
        </Svg>
      </View>
    </View>
  );
}