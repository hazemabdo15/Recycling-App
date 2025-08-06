import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAIWorkflow } from "../hooks/useAIWorkflow";
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "../styles/theme";

let Reanimated,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming;

try {
  const reanimated = require("react-native-reanimated");
  Reanimated = reanimated.default;
  interpolate = reanimated.interpolate;
  runOnJS = reanimated.runOnJS;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withRepeat = reanimated.withRepeat;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require("react-native");
  Reanimated = { View: RNView };
  interpolate = (value, input, output) => output[0];
  runOnJS = (fn) => fn;
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withRepeat = (value) => value;
  withSpring = (value) => value;
  withTiming = (value) => value;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;
const DISMISS_THRESHOLD = 150;
export default function VoiceModal() {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedURI, setRecordedURI] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const recording = useRef(null);
  const sound = useRef(null);
  const durationInterval = useRef(null);
  const waveformAnimation = useRef(new Animated.Value(0)).current;
  const recordingScale = useSharedValue(1);
  const recordingOpacity = useSharedValue(1);

  const spinnerRotation = useSharedValue(0);

  const { processAudioToMaterials, isProcessing } = useAIWorkflow();

  useEffect(() => {
    if (isProcessing) {
      spinnerRotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1,
        false
      );
    } else {
      spinnerRotation.value = 0;
    }
  }, [isProcessing, spinnerRotation]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  useEffect(() => {
    return () => {
      if (recording.current) {
        recording.current.stopAndUnloadAsync();
      }
      if (sound.current) {
        sound.current.unloadAsync();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);
  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        Animated.loop(
          Animated.timing(waveformAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          })
        ).start();
      };
      animate();
      const interval = setInterval(() => {
        setWaveformData((prev) => [...prev.slice(-20), Math.random() * 100]);
      }, 100);
      return () => clearInterval(interval);
    } else {
      waveformAnimation.setValue(0);
    }
  }, [isRecording, waveformAnimation]);
  useEffect(() => {
    if (isRecording) {
      recordingScale.value = withSpring(1.1, { damping: 4, stiffness: 100 });
      recordingOpacity.value = withTiming(0.8, { duration: 500 });
    } else {
      recordingScale.value = withSpring(1);
      recordingOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording, recordingScale, recordingOpacity]);
  const dismissModal = useCallback(() => {
    translateY.value = withTiming(MODAL_HEIGHT, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(router.back)();
    });
  }, [translateY, opacity]);
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        opacity.value = interpolate(
          event.translationY,
          [0, DISMISS_THRESHOLD],
          [1, 0.5]
        );
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
        runOnJS(dismissModal)();
      } else {
        translateY.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    });
  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  const recordingButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingScale.value }],
    opacity: recordingOpacity.value,
  }));
  const startRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Microphone permission is required to record audio");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm;codecs=opus",
          bitsPerSecond: 128000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      recording.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording");
    }
  };
  const stopRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!recording.current) return;
      setIsRecording(false);
      clearInterval(durationInterval.current);
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      setRecordedURI(uri);
      recording.current = null;
      setWaveformData([]);
    } catch (error) {
      console.error("Failed to stop recording:", error);
      alert("Failed to stop recording");
    }
  };
  const playRecording = async () => {
    try {
      if (!recordedURI) return;
      if (sound.current) {
        await sound.current.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedURI },
        { shouldPlay: true }
      );
      sound.current = newSound;
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error("Failed to play recording:", error);
      alert("Failed to play recording");
    }
  };
  const stopPlayback = async () => {
    try {
      if (sound.current) {
        await sound.current.stopAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Failed to stop playback:", error);
    }
  };
  const deleteRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecordedURI(null);
    setRecordingDuration(0);
    setWaveformData([]);
    if (sound.current) {
      sound.current.unloadAsync();
    }
  };
  const sendRecording = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!recordedURI) {
      alert("No recording found");
      return;
    }

    try {
      const result = await processAudioToMaterials(recordedURI);

      if (result.success) {
        try {
          router.replace({
            pathname: "/ai-results-modal",
            params: {
              extractedMaterials: JSON.stringify(
                result.extractedMaterials || []
              ),
              verifiedMaterials: JSON.stringify(result.verifiedMaterials || []),
              transcription: result.transcription || "",
            },
          });
        } catch (navError) {
          console.error("Navigation error:", navError);

          const availableCount =
            result.verifiedMaterials?.filter((m) => m.available)?.length || 0;
          const totalCount = result.verifiedMaterials?.length || 0;
          alert(
            `✅ Materials processed!\nFound: ${totalCount} items\nAvailable in database: ${availableCount}\n\nGo to explore tab to add items manually.`
          );
          dismissModal();
        }
      } else {
        alert(`AI Processing Failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Send recording error:", error);
      alert("Failed to process your recording. Please try again.");
    }
  };
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  // Responsive record button size and margin
  const recordButtonSize = SCREEN_HEIGHT < 700 ? 64 : 88;
  const recordButtonMargin = SCREEN_HEIGHT < 700 ? 18 : spacing.xl;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={dismissModal}
      />
      <GestureDetector gesture={panGesture}>
        <Reanimated.View
          style={[
            styles.modal,
            animatedModalStyle,
            { paddingTop: insets.top + 20 },
          ]}
        >
          <View style={styles.handleBar} />
          <View style={styles.header}></View>
          <View style={styles.visualizationContainer}>
            {isRecording ? (
              <View style={styles.waveformContainer}>
                <View style={styles.recordingStatus}>
                  <MaterialCommunityIcons
                    name="microphone"
                    size={24}
                    color={colors.white}
                  />
                  <Text style={styles.listeningText}>
                    I&apos;m listening...
                  </Text>
                </View>
                <View style={styles.waveform}>
                  {waveformData.map((height, index) => (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveformBar,
                        {
                          height: Math.max(4, height * 0.8),
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.recordingIndicator}>● REC</Text>
              </View>
            ) : (
              <View style={styles.promptContainer}>
                <View style={styles.aiAvatar}>
                  <MaterialCommunityIcons
                    name="robot"
                    size={36}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.promptTitle}>
                  How can I help you recycle today?
                </Text>
                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesLabel}>
                    Try saying something like:
                  </Text>
                  <View style={styles.examplesList}>
                    <View style={styles.examplesRow}>
                      <View style={styles.exampleItem}>
                        <MaterialCommunityIcons
                          name="bottle-soda"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.exampleText}>
                          &ldquo;I have 2 kilos of plastic bottles&rdquo;
                        </Text>
                      </View>
                      <View style={styles.exampleItem}>
                        <MaterialCommunityIcons
                          name="newspaper"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.exampleText}>
                          &ldquo;5 kilos of shredded papers&rdquo;
                        </Text>
                      </View>
                    </View>
                    <View style={styles.examplesRow}>
                      <View style={styles.exampleItem}>
                        <MaterialCommunityIcons
                          name="silverware"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.exampleText}>
                          &ldquo;Metal cans and aluminum&rdquo;
                        </Text>
                      </View>
                      <View style={styles.exampleItem}>
                        <MaterialCommunityIcons
                          name="bottle-wine"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.exampleText}>
                          &ldquo;Glass jars and bottles&rdquo;
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
            {recordingDuration > 0 && isRecording && (
              <Text style={styles.duration}>
                {formatDuration(recordingDuration)}
              </Text>
            )}
          </View>
          <View style={styles.controlsContainer}>
            {!recordedURI ? (
              <View style={styles.recordingControls}>
                <Reanimated.View style={recordingButtonStyle}>
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      {
                        width: recordButtonSize,
                        height: recordButtonSize,
                        borderRadius: recordButtonSize / 2,
                        marginBottom: recordButtonMargin,
                        backgroundColor: isRecording
                          ? colors.accent
                          : colors.primary,
                      },
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={isRecording ? "stop" : "microphone"}
                      size={recordButtonSize * 0.41}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </Reanimated.View>
                <Text style={styles.hint}>
                  {isRecording
                    ? "Tap to stop recording"
                    : "Tap to start recording"}
                </Text>
              </View>
            ) : (
              <View style={styles.playbackContainer}>
                <View style={styles.playbackControls}>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={isPlaying ? stopPlayback : playRecording}
                  >
                    <MaterialCommunityIcons
                      name={isPlaying ? "pause" : "play"}
                      size={28}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <View style={styles.durationContainer}>
                    <Text style={styles.playbackDuration}>
                      {formatDuration(recordingDuration)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={deleteRecording}
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={28}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    isProcessing && styles.sendButtonDisabled,
                  ]}
                  onPress={sendRecording}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Reanimated.View style={spinnerStyle}>
                        <MaterialCommunityIcons
                          name="reload"
                          size={20}
                          color={colors.white}
                        />
                      </Reanimated.View>
                      <Text style={styles.sendButtonText}>Processing...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="send"
                        size={20}
                        color={colors.white}
                      />
                      <Text style={styles.sendButtonText}>Send to AI</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Reanimated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  modal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    ...shadows.large,
    elevation: 8,
  },
  handleBar: {
    width: 50,
    height: 5,
    backgroundColor: colors.base300,
    borderRadius: 3,
    alignSelf: "center",
    marginVertical: spacing.sm,
  },
  header: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  title: {
    ...typography.title,
    fontSize: 24,
    fontWeight: "700",
    color: colors.black,
    textAlign: "center",
    lineHeight: 32,
  },
  visualizationContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingTop: spacing.lg,
    minHeight: 200,
  },
  waveformContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    justifyContent: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  waveformBar: {
    width: 4,
    minHeight: 6,
    marginHorizontal: 1.5,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  recordingIndicator: {
    ...typography.subtitle,
    color: colors.accent,
    fontWeight: "700",
    letterSpacing: 2,
    fontSize: 16,
  },
  duration: {
    ...typography.title,
    fontSize: 36,
    fontWeight: "300",
    color: colors.primary,
    marginTop: spacing.lg,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  controlsContainer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  recordingControls: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  recordButton: {
    justifyContent: "center",
    alignItems: "center",
    ...shadows.large,
    elevation: 0,
  },
  hint: {
    ...typography.subtitle,
    textAlign: "center",
    color: colors.neutral,
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
  },
  playbackContainer: {
    paddingVertical: spacing.lg,
  },
  playbackControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.base100,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.medium,
    elevation: 3,
  },
  durationContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  playbackDuration: {
    ...typography.title,
    fontSize: 22,
    fontWeight: "600",
    color: colors.primary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg + 2,
    paddingHorizontal: spacing.xl,
    ...shadows.medium,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral,
    opacity: 0.7,
  },
  sendButtonText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "700",
    marginLeft: spacing.sm,
    fontSize: 17,
  },
  promptContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: spacing.sm,
  },
  aiAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...shadows.medium,
    borderWidth: 2,
    borderColor: colors.primary + "20",
  },
  promptTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: "600",
    color: colors.black,
    textAlign: "center",
    marginBottom: spacing.md,
    lineHeight: 26,
  },
  examplesContainer: {
    width: 300,
    marginBottom: spacing.sm,
  },
  examplesLabel: {
    ...typography.subtitle,
    fontSize: 15,
    fontWeight: "600",
    color: colors.neutral,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  examplesList: {
    gap: spacing.sm,
  },
  examplesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  exampleItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.base100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.small,
    minHeight: 44,
  },
  exampleText: {
    ...typography.body,
    fontSize: 12,
    color: colors.neutral,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 16,
  },
  tapHint: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.neutral,
    textAlign: "center",
    opacity: 0.8,
    marginTop: spacing.sm,
  },
  recordingStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    ...shadows.large,
    elevation: 22,
  },
  listeningText: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: "600",
    marginLeft: spacing.sm,
    fontSize: 16,
  },
});
