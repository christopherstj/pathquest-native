/**
 * ElevationProfile - "Topographic Expedition" Chart
 *
 * A grade-coded elevation chart with:
 * - Line segments colored by actual terrain steepness at each point
 * - Summit markers positioned ON the elevation line
 * - Interactive scrubber with floating tooltip
 * - Axis labels for elevation and distance
 */

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Pressable, LayoutChangeEvent } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Line,
  Circle,
  G,
  Text as SvgText,
} from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import type { SummitWithPeak } from "@pathquest/shared";

import { CardFrame, Text } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { metersToFeet, metersToMiles } from "@/src/utils/geo";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ChartDataPoint {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized (0 = top, 1 = bottom)
  elevation: number; // meters
  distance: number; // meters
  time: number; // seconds
  grade: number; // percentage
}

interface SummitMarkerData {
  id: string;
  peakId: string;
  peakName: string;
  peakElevation?: number;
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  timestamp: string;
  timeElapsed: number; // seconds from start
}

interface GradeSegment {
  path: string;
  color: string;
}

interface ElevationProfileProps {
  vertProfile?: number[];
  distanceStream?: number[];
  timeStream?: number[];
  activityStartTime: string;
  summits: SummitWithPeak[];
  height?: number;
  accentColor?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function sampleDown<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = arr.length / maxPoints;
  const out: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(arr[Math.floor(i * step)]!);
  }
  // Always include last point
  if (out[out.length - 1] !== arr[arr.length - 1]) {
    out.push(arr[arr.length - 1]!);
  }
  return out;
}

function findClosestIndex(sorted: number[], target: number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = sorted[mid]!;
    if (v === target) return mid;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  const idx = Math.max(0, Math.min(sorted.length - 1, lo));
  if (idx === 0) return 0;
  const a = sorted[idx - 1]!;
  const b = sorted[idx]!;
  return Math.abs(a - target) <= Math.abs(b - target) ? idx - 1 : idx;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function getGradeColor(grade: number, isDark: boolean): string {
  const absGrade = Math.abs(grade);
  // Green for flat/easy, amber for moderate, rust/red for steep
  if (absGrade < 5) return isDark ? "#5B9167" : "#4D7A57"; // Forest green (primary)
  if (absGrade < 10) return isDark ? "#8B9A5B" : "#7A8A4B"; // Moss/olive
  if (absGrade < 15) return isDark ? "#B8845A" : "#C9915A"; // Rust/amber (secondary)
  return isDark ? "#C45A3A" : "#B84A2A"; // Deep rust - very steep
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ElevationProfile({
  vertProfile,
  distanceStream,
  timeStream,
  activityStartTime,
  summits,
  height = 200,
}: ElevationProfileProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [chartWidth, setChartWidth] = useState(300);
  const [selectedSummit, setSelectedSummit] = useState<SummitMarkerData | null>(null);

  // Scrubber state
  const scrubberX = useSharedValue(-1);
  const scrubberVisible = useSharedValue(0);
  const [scrubberData, setScrubberData] = useState<ChartDataPoint | null>(null);
  const [nearbySummit, setNearbySummit] = useState<SummitMarkerData | null>(null);

  // Chart dimensions
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 40; // Extra space for summit markers above the line
  const paddingBottom = 30;
  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;

  // Process elevation data
  const chartData = useMemo((): ChartDataPoint[] | null => {
    const elevations = Array.isArray(vertProfile) ? vertProfile.filter((n) => typeof n === "number") : [];
    if (elevations.length < 2) return null;

    const distances = Array.isArray(distanceStream) && distanceStream.length === elevations.length
      ? distanceStream
      : elevations.map((_, i) => i); // fallback to index

    const times = Array.isArray(timeStream) && timeStream.length === elevations.length
      ? timeStream
      : elevations.map((_, i) => i * 60); // fallback

    // Sample to keep SVG lightweight
    const maxPoints = 200;
    const indices = sampleDown(elevations.map((_, i) => i), maxPoints);

    const sampledElev = indices.map((i) => elevations[i]!);
    const sampledDist = indices.map((i) => distances[i]!);
    const sampledTime = indices.map((i) => times[i]!);

    const minE = Math.min(...sampledElev);
    const maxE = Math.max(...sampledElev);
    const range = Math.max(1, maxE - minE);

    const minD = sampledDist[0] ?? 0;
    const maxD = sampledDist[sampledDist.length - 1] ?? minD + 1;
    const dRange = Math.max(1e-6, maxD - minD);

    return sampledElev.map((elev, i) => {
      const dist = sampledDist[i]!;
      const time = sampledTime[i]!;

      // Calculate grade (use next point, or previous for last point)
      let grade = 0;
      if (i < sampledElev.length - 1) {
        const dElev = sampledElev[i + 1]! - elev;
        const dDist = sampledDist[i + 1]! - dist;
        if (dDist > 0) grade = (dElev / dDist) * 100;
      } else if (i > 0) {
        const dElev = elev - sampledElev[i - 1]!;
        const dDist = dist - sampledDist[i - 1]!;
        if (dDist > 0) grade = (dElev / dDist) * 100;
      }

      return {
        x: (dist - minD) / dRange,
        y: 1 - (elev - minE) / range, // Flip so higher = lower y
        elevation: elev,
        distance: dist,
        time: time,
        grade: grade,
      };
    });
  }, [vertProfile, distanceStream, timeStream]);

  // Min/max for axis labels
  const elevationRange = useMemo(() => {
    if (!chartData) return { min: 0, max: 0, minFt: 0, maxFt: 0 };
    const elevs = chartData.map((d) => d.elevation);
    const min = Math.min(...elevs);
    const max = Math.max(...elevs);
    return {
      min,
      max,
      minFt: Math.round(metersToFeet(min)),
      maxFt: Math.round(metersToFeet(max)),
    };
  }, [chartData]);

  const distanceRange = useMemo(() => {
    if (!chartData) return { min: 0, max: 0, maxMi: 0 };
    const dists = chartData.map((d) => d.distance);
    return {
      min: Math.min(...dists),
      max: Math.max(...dists),
      maxMi: metersToMiles(Math.max(...dists)),
    };
  }, [chartData]);

  // Process summit markers
  const summitMarkers = useMemo((): SummitMarkerData[] => {
    if (!chartData || !Array.isArray(timeStream) || timeStream.length < 2) return [];

    const startMs = new Date(activityStartTime).getTime();
    if (!isFinite(startMs)) return [];

    return (summits ?? [])
      .map((s) => {
        const summitMs = new Date(s.timestamp).getTime();
        if (!isFinite(summitMs)) return null;
        const dtSec = (summitMs - startMs) / 1000;
        if (!isFinite(dtSec) || dtSec < 0) return null;

        // Find the actual chart data point closest to this time
        let closestIdx = 0;
        let minTimeDiff = Infinity;
        for (let i = 0; i < chartData.length; i++) {
          const diff = Math.abs(chartData[i]!.time - dtSec);
          if (diff < minTimeDiff) {
            minTimeDiff = diff;
            closestIdx = i;
          }
        }

        const point = chartData[closestIdx]!;

        return {
          id: s.id,
          peakId: s.peak.id,
          peakName: s.peak.name,
          peakElevation: s.peak.elevation,
          x: point.x,
          y: point.y,
          timestamp: s.timestamp,
          timeElapsed: dtSec,
        };
      })
      .filter(Boolean) as SummitMarkerData[];
  }, [activityStartTime, chartData, summits, timeStream]);

  // Build grade-colored line segments
  const gradeSegments = useMemo((): GradeSegment[] => {
    if (!chartData || chartData.length < 2) return [];

    const segments: GradeSegment[] = [];
    let currentColor = getGradeColor(chartData[0]!.grade, isDark);
    let currentPath = "";
    let pathStart = true;

    for (let i = 0; i < chartData.length; i++) {
      const d = chartData[i]!;
      const px = paddingLeft + d.x * innerWidth;
      const py = paddingTop + d.y * innerHeight;
      const segmentColor = getGradeColor(d.grade, isDark);

      if (pathStart) {
        currentPath = `M ${px} ${py}`;
        pathStart = false;
      } else if (segmentColor !== currentColor) {
        // Color changed - finish current segment and start new one
        segments.push({ path: currentPath, color: currentColor });
        // Start new path from previous point
        const prevD = chartData[i - 1]!;
        const prevPx = paddingLeft + prevD.x * innerWidth;
        const prevPy = paddingTop + prevD.y * innerHeight;
        currentPath = `M ${prevPx} ${prevPy} L ${px} ${py}`;
        currentColor = segmentColor;
      } else {
        currentPath += ` L ${px} ${py}`;
      }
    }

    // Push final segment
    if (currentPath) {
      segments.push({ path: currentPath, color: currentColor });
    }

    return segments;
  }, [chartData, innerWidth, innerHeight, paddingLeft, paddingTop, isDark]);

  // Build SVG path for the filled area (simple fill, no grade coloring)
  const fillPath = useMemo(() => {
    if (!chartData || chartData.length < 2) return "";

    const points = chartData.map((d) => ({
      x: paddingLeft + d.x * innerWidth,
      y: paddingTop + d.y * innerHeight,
    }));

    // Start from bottom-left, trace the profile, then close at bottom-right
    let path = `M ${paddingLeft} ${paddingTop + innerHeight}`;
    points.forEach((p) => {
      path += ` L ${p.x} ${p.y}`;
    });
    path += ` L ${paddingLeft + innerWidth} ${paddingTop + innerHeight} Z`;

    return path;
  }, [chartData, innerWidth, innerHeight, paddingLeft, paddingTop]);

  // Handle layout change
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  // Update scrubber data (called from UI thread via runOnJS)
  const updateScrubberAtX = useCallback(
    (xPos: number) => {
      if (!chartData || chartData.length === 0) {
        setScrubberData(null);
        setNearbySummit(null);
        return;
      }

      const normalizedX = Math.max(0, Math.min(1, (xPos - paddingLeft) / innerWidth));

      // Find closest data point
      let closestIdx = 0;
      let minDiff = Infinity;
      for (let i = 0; i < chartData.length; i++) {
        const diff = Math.abs(chartData[i]!.x - normalizedX);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      }

      setScrubberData(chartData[closestIdx] ?? null);

      // Check if we're near a summit (within 3% of chart width)
      let foundSummit: SummitMarkerData | null = null;
      for (const summit of summitMarkers) {
        if (Math.abs(summit.x - normalizedX) < 0.03) {
          foundSummit = summit;
          break;
        }
      }
      setNearbySummit(foundSummit);
    },
    [chartData, innerWidth, paddingLeft, summitMarkers]
  );

  // Clear scrubber data (called from UI thread via runOnJS)
  const clearScrubber = useCallback(() => {
    setScrubberData(null);
    setNearbySummit(null);
  }, []);

  // Gesture handler for scrubbing
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      scrubberX.value = e.x;
      scrubberVisible.value = withTiming(1, { duration: 150 });
      runOnJS(updateScrubberAtX)(e.x);
    })
    .onUpdate((e) => {
      const clampedX = Math.max(paddingLeft, Math.min(paddingLeft + innerWidth, e.x));
      scrubberX.value = clampedX;
      runOnJS(updateScrubberAtX)(clampedX);
    })
    .onEnd(() => {
      scrubberVisible.value = withTiming(0, { duration: 300 });
      runOnJS(clearScrubber)();
    });

  // Handle summit tap
  const handleSummitTap = useCallback((summit: SummitMarkerData) => {
    setSelectedSummit((prev) => (prev?.id === summit.id ? null : summit));
  }, []);

  // Navigate to peak detail
  const handleViewPeak = useCallback(
    (peakId: string) => {
      setSelectedSummit(null);
      router.push({
        pathname: "/explore/peak/[peakId]",
        params: { peakId },
      });
    },
    [router]
  );

  // Animated styles for scrubber
  const scrubberLineStyle = useAnimatedStyle(() => ({
    opacity: scrubberVisible.value,
    transform: [{ translateX: scrubberX.value }],
  }));

  const scrubberTooltipStyle = useAnimatedStyle(() => {
    const tooltipX = interpolate(
      scrubberX.value,
      [paddingLeft, paddingLeft + innerWidth],
      [0, innerWidth - 120],
      Extrapolation.CLAMP
    );
    return {
      opacity: scrubberVisible.value,
      transform: [{ translateX: tooltipX }],
    };
  });

  if (!chartData || chartData.length < 2) {
    return (
      <CardFrame topo="corner" seed="activity-elevation-empty" style={{ padding: 14 }}>
        <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
          Elevation Profile
        </Text>
        <Text className="text-muted-foreground text-sm mt-2">No elevation data available.</Text>
      </CardFrame>
    );
  }

  // Y-axis tick values
  const yTicks = [
    { value: elevationRange.maxFt, y: paddingTop },
    { value: Math.round((elevationRange.maxFt + elevationRange.minFt) / 2), y: paddingTop + innerHeight / 2 },
    { value: elevationRange.minFt, y: paddingTop + innerHeight },
  ];

  // X-axis tick values
  const xTicks = [
    { value: 0, x: paddingLeft },
    { value: distanceRange.maxMi / 2, x: paddingLeft + innerWidth / 2 },
    { value: distanceRange.maxMi, x: paddingLeft + innerWidth },
  ];

  return (
    <CardFrame topo="corner" seed="activity-elevation-profile" style={{ padding: 14, position: "relative" }}>
      {/* Title */}
      <Text className="text-xs uppercase tracking-widest" style={{ color: colors.mutedForeground as any }}>
        Elevation Profile
      </Text>

      {/* Scrubber tooltip - absolute positioned top-right */}
      {scrubberData && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: isDark ? "rgba(37, 34, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
              borderRadius: 8,
              padding: 8,
              borderWidth: nearbySummit ? 2 : 1,
              borderColor: nearbySummit ? colors.summited as string : colors.border as string,
              minWidth: 100,
              alignItems: "flex-end",
              zIndex: 50,
            },
            { opacity: scrubberVisible.value > 0 ? 1 : 0 },
          ]}
          pointerEvents="none"
        >
          {/* Summit name when nearby */}
          {nearbySummit && (
            <View style={{ 
              marginBottom: 4,
              paddingBottom: 4,
              borderBottomWidth: 1,
              borderBottomColor: `${colors.summited}33`,
              width: "100%",
              maxWidth: 140,
            }}>
              <Text 
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ 
                  color: colors.summited as any, 
                  fontSize: 11, 
                  fontWeight: "700",
                  textAlign: "right",
                }}
              >
                🏔️ {nearbySummit.peakName}
              </Text>
            </View>
          )}
          {/* Elevation */}
          <Text style={{ color: colors.foreground as any, fontSize: 12, fontWeight: "600" }}>
            {Math.round(metersToFeet(scrubberData.elevation)).toLocaleString()} ft
          </Text>
          {/* Distance & Grade */}
          <Text style={{ color: colors.mutedForeground as any, fontSize: 10, marginTop: 2 }}>
            {metersToMiles(scrubberData.distance).toFixed(2)} mi • {scrubberData.grade >= 0 ? "+" : ""}{scrubberData.grade.toFixed(1)}%
          </Text>
        </Animated.View>
      )}

      <View style={{ marginTop: 10, position: "relative" }} onLayout={onLayout}>
        <GestureDetector gesture={panGesture}>
          <View>
            <Svg width={chartWidth} height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
              <Defs>
                {/* Simple gradient for area fill */}
                <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.primary as string} stopOpacity={isDark ? 0.25 : 0.18} />
                  <Stop offset="100%" stopColor={colors.primary as string} stopOpacity={isDark ? 0.08 : 0.05} />
                </LinearGradient>
              </Defs>

              {/* Y-axis grid lines (subtle) */}
              {yTicks.map((tick, i) => (
                <Line
                  key={`y-grid-${i}`}
                  x1={paddingLeft}
                  x2={paddingLeft + innerWidth}
                  y1={tick.y}
                  y2={tick.y}
                  stroke={colors.border as string}
                  strokeOpacity={isDark ? 0.25 : 0.2}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}

              {/* Filled area under the line */}
              <Path d={fillPath} fill="url(#areaFill)" />

              {/* Grade-colored line segments */}
              {gradeSegments.map((seg, i) => (
                <Path
                  key={`grade-seg-${i}`}
                  d={seg.path}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {/* Y-axis labels */}
              {yTicks.map((tick, i) => (
                <SvgText
                  key={`y-label-${i}`}
                  x={paddingLeft - 8}
                  y={tick.y + 4}
                  fill={colors.mutedForeground as string}
                  fontSize={10}
                  fontWeight="500"
                  textAnchor="end"
                >
                  {tick.value.toLocaleString()}
                </SvgText>
              ))}

              {/* X-axis labels */}
              {xTicks.map((tick, i) => (
                <SvgText
                  key={`x-label-${i}`}
                  x={tick.x}
                  y={height - 8}
                  fill={colors.mutedForeground as string}
                  fontSize={10}
                  fontWeight="500"
                  textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
                >
                  {tick.value.toFixed(1)} mi
                </SvgText>
              ))}

              {/* Summit markers - tiny mountain peaks with glow */}
              {summitMarkers.map((summit) => {
                const cx = paddingLeft + summit.x * innerWidth;
                const lineY = paddingTop + summit.y * innerHeight;
                // Mountain icon sits above the line
                const peakSize = 12;
                const peakBottom = lineY - 6;
                const peakTop = peakBottom - peakSize;

                return (
                  <G key={summit.id}>
                    {/* Outer glow - soft radial effect */}
                    <Circle
                      cx={cx}
                      cy={peakBottom - peakSize / 2}
                      r={16}
                      fill={colors.summited as string}
                      opacity={0.15}
                    />
                    <Circle
                      cx={cx}
                      cy={peakBottom - peakSize / 2}
                      r={11}
                      fill={colors.summited as string}
                      opacity={0.2}
                    />
                    {/* Mountain peak triangle */}
                    <Path
                      d={`M ${cx} ${peakTop} L ${cx + peakSize} ${peakBottom} L ${cx - peakSize} ${peakBottom} Z`}
                      fill={colors.summited as string}
                      stroke={isDark ? colors.background as string : "#FFFFFF"}
                      strokeWidth={2}
                      strokeLinejoin="round"
                    />
                    {/* Snow cap on peak */}
                    <Path
                      d={`M ${cx} ${peakTop} L ${cx + 4} ${peakTop + 5} L ${cx - 4} ${peakTop + 5} Z`}
                      fill="#FFFFFF"
                      opacity={0.85}
                    />
                    {/* Thin stem connecting to line */}
                    <Line
                      x1={cx}
                      y1={peakBottom}
                      x2={cx}
                      y2={lineY}
                      stroke={colors.summited as string}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    {/* Small dot on the line */}
                    <Circle
                      cx={cx}
                      cy={lineY}
                      r={3}
                      fill={colors.summited as string}
                    />
                  </G>
                );
              })}
            </Svg>

            {/* Tappable summit hit areas (overlay) - covers the mountain icon */}
            {summitMarkers.map((summit) => {
              const cx = paddingLeft + summit.x * innerWidth;
              const lineY = paddingTop + summit.y * innerHeight;
              const peakSize = 12;
              const peakBottom = lineY - 6;
              const peakTop = peakBottom - peakSize;

              return (
                <Pressable
                  key={`tap-${summit.id}`}
                  onPress={() => handleSummitTap(summit)}
                  style={{
                    position: "absolute",
                    left: cx - 20,
                    top: peakTop - 8,
                    width: 40,
                    height: lineY - peakTop + 12,
                    borderRadius: 8,
                  }}
                />
              );
            })}
          </View>
        </GestureDetector>

        {/* Scrubber line (animated) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: paddingTop,
              width: 2,
              height: innerHeight,
              backgroundColor: colors.foreground as string,
              borderRadius: 1,
            },
            scrubberLineStyle,
          ]}
          pointerEvents="none"
        />


        {/* Summit tooltip (on tap) */}
        {selectedSummit && (
          <View
            style={{
              position: "absolute",
              top: Math.max(0, paddingTop + selectedSummit.y * innerHeight - 90),
              left: Math.max(
                10,
                Math.min(
                  chartWidth - 160,
                  paddingLeft + selectedSummit.x * innerWidth - 75
                )
              ),
              backgroundColor: isDark ? "rgba(37, 34, 30, 0.98)" : "rgba(255, 255, 255, 0.98)",
              borderRadius: 12,
              padding: 12,
              borderWidth: 2,
              borderColor: colors.summited as string,
              width: 150,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 8,
              zIndex: 100,
            }}
          >
            <Text style={{ color: colors.foreground as any, fontSize: 13, fontWeight: "700" }}>
              {selectedSummit.peakName}
            </Text>
            {selectedSummit.peakElevation && (
              <Text style={{ color: colors.mutedForeground as any, fontSize: 11, marginTop: 2 }}>
                {Math.round(metersToFeet(selectedSummit.peakElevation)).toLocaleString()} ft
              </Text>
            )}
            <Text style={{ color: colors.mutedForeground as any, fontSize: 10, marginTop: 4 }}>
              Summited at {formatDuration(selectedSummit.timeElapsed)}
            </Text>
            <Pressable
              onPress={() => handleViewPeak(selectedSummit.peakId)}
              style={{
                marginTop: 8,
                backgroundColor: `${colors.summited}22`,
                borderRadius: 6,
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: `${colors.summited}44`,
              }}
            >
              <Text
                style={{
                  color: colors.summited as any,
                  fontSize: 11,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                View Peak
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Grade Legend */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 12,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View
            style={{
              width: 16,
              height: 4,
              backgroundColor: isDark ? "#5B9167" : "#4D7A57",
              borderRadius: 2,
            }}
          />
          <Text style={{ color: colors.mutedForeground as any, fontSize: 10 }}>
            {"<5%"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View
            style={{
              width: 16,
              height: 4,
              backgroundColor: isDark ? "#8B9A5B" : "#7A8A4B",
              borderRadius: 2,
            }}
          />
          <Text style={{ color: colors.mutedForeground as any, fontSize: 10 }}>
            5-10%
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View
            style={{
              width: 16,
              height: 4,
              backgroundColor: isDark ? "#B8845A" : "#C9915A",
              borderRadius: 2,
            }}
          />
          <Text style={{ color: colors.mutedForeground as any, fontSize: 10 }}>
            10-15%
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View
            style={{
              width: 16,
              height: 4,
              backgroundColor: isDark ? "#C45A3A" : "#B84A2A",
              borderRadius: 2,
            }}
          />
          <Text style={{ color: colors.mutedForeground as any, fontSize: 10 }}>
            {">15%"}
          </Text>
        </View>
      </View>
    </CardFrame>
  );
}
