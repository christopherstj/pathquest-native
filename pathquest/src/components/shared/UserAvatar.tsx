import React, { useMemo } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { UserCircle } from "lucide-react-native";
import { Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

type UserAvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<UserAvatarSize, number> = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
};

export interface UserAvatarProps {
  name?: string | null;
  /** Image URL */
  uri?: string | null;
  size?: UserAvatarSize;
  /** If provided, avatar becomes tappable */
  onPress?: () => void;
  /** Defaults to theme primary */
  borderColor?: string;
}

export function UserAvatar({ name, uri, size = "md", onPress, borderColor }: UserAvatarProps) {
  const { colors, isDark } = useTheme();
  const px = SIZE_PX[size];

  const initials = useMemo(() => {
    const n = (name ?? "").trim();
    if (!n) return "";
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return (first + last).toUpperCase();
  }, [name]);

  const bColor = borderColor ?? (colors.primary as string);
  const background = isDark ? "rgba(91, 145, 103, 0.14)" : "rgba(77, 122, 87, 0.12)";

  const content = (
    <View
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
        borderWidth: 2,
        borderColor: `${bColor}${isDark ? "66" : "55"}` as any,
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: px, height: px }}
          resizeMode="cover"
        />
      ) : initials ? (
        <Text
          className="font-semibold"
          style={{
            color: colors.foreground as any,
            fontSize: Math.max(10, Math.round(px * 0.36)),
            letterSpacing: 0.5,
          }}
        >
          {initials}
        </Text>
      ) : (
        <UserCircle size={Math.round(px * 0.62)} color={bColor as any} strokeWidth={1.6} />
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} hitSlop={8}>
      {content}
    </TouchableOpacity>
  );
}


