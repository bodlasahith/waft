import { View, StyleSheet } from "react-native";

import AnimatedNode from "./AnimatedNode";
import GrowingEdge from "./GrowingEdge";
import ConnectionParticles from "./ConnectionParticles";
import SuccessBanner from "./SuccessBanner";

interface Props {
  me: {
    color: string;
    shape?: string;
    initial: string;
  };

  them: {
    color: string;
    shape?: string;
    initial: string;
  };

  alreadyConnected?: boolean;
}

export default function ConnectionAnimation({
  me,
  them,
  alreadyConnected,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AnimatedNode
          {...me}
        />
        <GrowingEdge
          width={150}
          delay={250}
          color={them.color}
        />
        <ConnectionParticles
          width={150}
          color={them.color}
        />
        <AnimatedNode
          {...them}
          delay={700}
        />
      </View>
      <SuccessBanner
        alreadyConnected={alreadyConnected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  container:{
    alignItems:"center",
    gap:40,
  }
});