import React from "react";
import { View } from "react-native";
import { Text, Value } from "@/src/components/ui";

export type GPSStripProps = {
  distanceText: string;
  bearingText: string;
  vertText: string;
  backgroundColor: string;
  borderColor: string;
};

export function GPSStrip({ distanceText, bearingText, vertText, backgroundColor, borderColor }: GPSStripProps) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
      <View
        style={{
          flex: 1,
          backgroundColor: backgroundColor as any,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: borderColor as any,
        }}
      >
        <Value className="text-foreground text-sm font-semibold">{distanceText}</Value>
        <Text className="text-muted-foreground text-[10px] mt-0.5">away</Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: backgroundColor as any,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: borderColor as any,
        }}
      >
        <Value className="text-foreground text-sm font-semibold">{bearingText}</Value>
        <Text className="text-muted-foreground text-[10px] mt-0.5">bearing</Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: backgroundColor as any,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
          borderWidth: 1,
          borderColor: borderColor as any,
        }}
      >
        <Value className="text-foreground text-sm font-semibold">{vertText}</Value>
        <Text className="text-muted-foreground text-[10px] mt-0.5">vert</Text>
      </View>
    </View>
  );
}


