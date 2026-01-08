import React from "react";
import { View, ViewStyle } from "react-native";
import { Text, Value } from "@/src/components/ui";

export type GPSStripProps = {
  distanceText: string;
  bearingText: string;
  vertText: string;
  backgroundColor: string;
  borderColor: string;
};

interface GPSStatBoxProps {
  value: string;
  label: string;
  backgroundColor: string;
  borderColor: string;
}

/**
 * Individual stat box for GPS data display.
 * Extracted to reduce code duplication.
 */
const GPSStatBox: React.FC<GPSStatBoxProps> = ({ value, label, backgroundColor, borderColor }) => {
  const boxStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor,
  };

  return (
    <View style={boxStyle}>
      <Value className="text-foreground text-sm font-semibold">{value}</Value>
      <Text className="text-muted-foreground text-[10px] mt-0.5">{label}</Text>
    </View>
  );
};

/**
 * GPS Strip component showing distance, bearing, and vertical distance.
 * Used in PeakDetailHero and FloatingPeakCard.
 */
export function GPSStrip({ distanceText, bearingText, vertText, backgroundColor, borderColor }: GPSStripProps) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
      <GPSStatBox value={distanceText} label="away" backgroundColor={backgroundColor} borderColor={borderColor} />
      <GPSStatBox value={bearingText} label="bearing" backgroundColor={backgroundColor} borderColor={borderColor} />
      <GPSStatBox value={vertText} label="vert" backgroundColor={backgroundColor} borderColor={borderColor} />
    </View>
  );
}
