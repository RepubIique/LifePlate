import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Chip, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { dateKeyFromIso, todayDateKey } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useAuth } from "@/context/AuthContext";
import { useHydration } from "@/context/HydrationContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { usePlusPaywall } from "@/context/PlusPaywallContext";
import { useWeekInsights } from "@/context/WeekInsightsContext";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { assembleReportData } from "@/lib/pdf/assembleReportData";
import { buildReportHtml } from "@/lib/pdf/buildReportHtml";
import { exportPdfReport, preloadReportSource } from "@/lib/pdf/exportPdfReport";
import { exportTrendReportWithGating } from "@/lib/pdf/exportTrendReportWithGating";
import type { ReportSourceBundle } from "@/lib/pdf/reportSourceCache";
import { REPORT_TEMPLATES, type ReportTemplateId } from "@/lib/pdf/reportTemplates";
import {
  REPORT_WINDOW_OPTIONS,
  resolveReportWindow,
  type ReportWindowId,
} from "@/lib/pdf/reportWindows";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  onClose: () => void;
  defaultWindowId?: ReportWindowId;
  onExported?: (message: string) => void;
};

function dateKeyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function previewCacheKey(input: {
  templateId: ReportTemplateId;
  windowId: ReportWindowId;
  customStart: string;
  customEnd: string;
  fullReport: boolean;
}): string {
  return [
    input.templateId,
    input.windowId,
    input.customStart,
    input.customEnd,
    input.fullReport ? "plus" : "free",
  ].join(":");
}

export function PdfExportPreviewModal({
  visible,
  onClose,
  defaultWindowId = "this_week",
  onExported,
}: Props) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { semantic } = useAppColors();
  const { profile, refreshProfile } = useAuth();
  const { openPaywall } = usePlusPaywall();
  const { hydrationByDate } = useHydration();
  const { dashboard } = useNutritionDashboard();
  const { insights: weekInsights } = useWeekInsights();

  const [templateId, setTemplateId] = useState<ReportTemplateId>("trend");
  const [windowId, setWindowId] = useState<ReportWindowId>(defaultWindowId);
  const [customStart, setCustomStart] = useState(dateKeyToDate(todayDateKey()));
  const [customEnd, setCustomEnd] = useState(dateKeyToDate(todayDateKey()));
  const [picker, setPicker] = useState<"start" | "end" | null>(null);
  const [source, setSource] = useState<ReportSourceBundle | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const htmlCacheRef = useRef(new Map<string, string>());
  const sourceLoadIdRef = useRef(0);

  const seeds = useMemo(
    () => ({
      hydrationByDate,
      coachInsight:
        dashboard?.lifeplateInsight?.trim() ||
        dashboard?.coachSummary?.trim() ||
        weekInsights?.coachNudge?.trim() ||
        null,
    }),
    [dashboard?.coachSummary, dashboard?.lifeplateInsight, hydrationByDate, weekInsights?.coachNudge],
  );

  const customRange = useMemo(
    () => ({
      startKey: dateKeyFromIso(customStart.toISOString()),
      endKey: dateKeyFromIso(customEnd.toISOString()),
    }),
    [customEnd, customStart],
  );

  const windowLabel = useMemo(
    () => resolveReportWindow(windowId, windowId === "custom" ? customRange : undefined).label,
    [customRange, windowId],
  );

  const exportOptions = useMemo(
    () => ({
      windowId,
      customRange: windowId === "custom" ? customRange : undefined,
      template: templateId,
    }),
    [customRange, templateId, windowId],
  );

  const seedsRef = useRef(seeds);
  seedsRef.current = seeds;

  useEffect(() => {
    if (!visible || !profile) {
      if (!visible) {
        setSource(null);
        setPreviewHtml(null);
        setPreviewError(null);
        htmlCacheRef.current.clear();
      }
      return;
    }

    setWindowId(defaultWindowId);
    const loadId = ++sourceLoadIdRef.current;
    setSourceLoading(true);
    setPreviewError(null);

    void preloadReportSource(profile, seedsRef.current)
      .then((bundle) => {
        if (loadId !== sourceLoadIdRef.current) return;
        setSource(bundle);
      })
      .catch((error) => {
        if (loadId !== sourceLoadIdRef.current) return;
        setPreviewError(friendlyErrorMessage(error));
        setSource(null);
      })
      .finally(() => {
        if (loadId === sourceLoadIdRef.current) {
          setSourceLoading(false);
        }
      });
  }, [defaultWindowId, profile, visible]);

  const rebuildPreview = useCallback(() => {
    if (!profile || !source) return;

    const cacheKey = previewCacheKey({
      templateId,
      windowId,
      customStart: customRange.startKey,
      customEnd: customRange.endKey,
      fullReport: profile.isPaid,
    });

    const cachedHtml = htmlCacheRef.current.get(cacheKey);
    if (cachedHtml) {
      setPreviewHtml(cachedHtml);
      setPreviewError(null);
      return;
    }

    try {
      const data = assembleReportData(profile, source, {
        ...exportOptions,
        fullReport: profile.isPaid,
      });
      const html = buildReportHtml(data);
      htmlCacheRef.current.set(cacheKey, html);
      setPreviewHtml(html);
      setPreviewError(null);
    } catch (error) {
      setPreviewError(friendlyErrorMessage(error));
      setPreviewHtml(null);
    }
  }, [customRange.endKey, customRange.startKey, exportOptions, profile, source, templateId, windowId]);

  useEffect(() => {
    if (!visible || !source || sourceLoading) return;
    rebuildPreview();
  }, [rebuildPreview, source, sourceLoading, visible]);

  async function handleExport() {
    if (!profile || !source) return;
    setExporting(true);
    try {
      if (profile.isPaid) {
        await exportPdfReport({ profile, fullReport: true, source, ...exportOptions });
        onExported?.("Full report exported");
        onClose();
        return;
      }

      const { fullReport } = await exportTrendReportWithGating({
        profile,
        refreshProfile,
        openPaywall,
        source,
        ...exportOptions,
      });
      onExported?.(fullReport ? "Full report exported" : "Trend snapshot exported");
      onClose();
    } catch (error) {
      onExported?.(friendlyErrorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  if (!visible || !profile) return null;

  const previewBusy = sourceLoading || (!previewHtml && !previewError && !!source);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Text variant="titleLarge" style={styles.title}>
            Export report
          </Text>
          <Button mode="text" onPress={onClose} disabled={exporting}>
            Close
          </Button>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Template
          </Text>
          <View style={styles.chipRow}>
            {REPORT_TEMPLATES.map((template) => (
              <Chip
                key={template.id}
                selected={templateId === template.id}
                onPress={() => setTemplateId(template.id)}
                style={styles.chip}
                icon={template.icon}
              >
                {template.title}
              </Chip>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Period
          </Text>
          <View style={styles.chipRow}>
            {REPORT_WINDOW_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                selected={windowId === option.id}
                onPress={() => setWindowId(option.id)}
                style={styles.chip}
              >
                {option.label}
              </Chip>
            ))}
          </View>

          {windowId === "custom" ? (
            <PremiumCard noBlur style={styles.customCard}>
              <View style={styles.customRow}>
                <Text variant="bodyMedium">From</Text>
                <Button mode="outlined" onPress={() => setPicker("start")}>
                  {dateKeyFromIso(customStart.toISOString())}
                </Button>
              </View>
              <View style={styles.customRow}>
                <Text variant="bodyMedium">To</Text>
                <Button mode="outlined" onPress={() => setPicker("end")}>
                  {dateKeyFromIso(customEnd.toISOString())}
                </Button>
              </View>
            </PremiumCard>
          ) : null}

          <Text variant="bodySmall" style={styles.windowHint}>
            {windowLabel}
            {!profile.isPaid ? " · Free export includes a 1-page snapshot" : " · Plus includes full breakdown"}
          </Text>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Preview
          </Text>
          <PremiumCard noBlur style={styles.previewCard}>
            {previewBusy ? (
              <View style={styles.previewLoading}>
                <ActivityIndicator color={semantic.primary} />
                <Text variant="bodySmall" style={styles.previewLoadingText}>
                  {sourceLoading ? "Loading report data…" : "Building preview…"}
                </Text>
              </View>
            ) : previewError ? (
              <Text variant="bodyMedium" style={styles.previewError}>
                {previewError}
              </Text>
            ) : previewHtml ? (
              <WebView
                originWhitelist={["*"]}
                source={{ html: previewHtml }}
                style={styles.webview}
                scrollEnabled
                nestedScrollEnabled
              />
            ) : null}
          </PremiumCard>

          <PremiumCard noBlur style={styles.comingSoonCard}>
            <View style={styles.comingSoonRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color={semantic.primary} />
              <View style={styles.comingSoonCopy}>
                <Text variant="titleSmall">Scheduled email reports</Text>
                <Text variant="bodySmall" style={styles.comingSoonHint}>
                  Coming soon — monthly PDF to your inbox
                </Text>
              </View>
            </View>
            <View style={styles.comingSoonRow}>
              <MaterialCommunityIcons name="link-variant" size={20} color={semantic.primary} />
              <View style={styles.comingSoonCopy}>
                <Text variant="titleSmall">Dietitian share link</Text>
                <Text variant="bodySmall" style={styles.comingSoonHint}>
                  Coming soon — time-limited read-only web report
                </Text>
              </View>
            </View>
          </PremiumCard>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button
            mode="contained"
            icon="file-pdf-box"
            onPress={() => void handleExport()}
            loading={exporting}
            disabled={exporting || sourceLoading || !source}
          >
            Export PDF
          </Button>
        </View>
      </View>

      {picker ? (
        <DateTimePicker
          value={picker === "start" ? customStart : customEnd}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(_event, date) => {
            setPicker(Platform.OS === "ios" ? picker : null);
            if (!date) return;
            if (picker === "start") setCustomStart(date);
            else setCustomEnd(date);
          }}
        />
      ) : null}
    </Modal>
  );
}

function createStyles({ semantic, tints, ui }: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: tints.creamLight,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    title: {
      color: semantic.primary,
      letterSpacing: 0.15,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    sectionLabel: {
      marginTop: spacing.sm,
      opacity: 0.65,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    chip: {
      marginBottom: spacing.xs,
    },
    customCard: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    customRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    windowHint: {
      opacity: 0.65,
      marginBottom: spacing.sm,
    },
    previewCard: {
      minHeight: 320,
      overflow: "hidden",
      padding: 0,
    },
    webview: {
      flex: 1,
      minHeight: 320,
      backgroundColor: "transparent",
    },
    previewLoading: {
      minHeight: 320,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
    },
    previewLoadingText: {
      opacity: 0.65,
    },
    previewError: {
      minHeight: 120,
      padding: spacing.md,
      color: semantic.danger,
    },
    comingSoonCard: {
      gap: spacing.md,
      marginTop: spacing.md,
      backgroundColor: ui.cardBackground,
    },
    comingSoonRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
    },
    comingSoonCopy: {
      flex: 1,
      gap: 2,
    },
    comingSoonHint: {
      opacity: 0.65,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tints.sageLight,
      backgroundColor: tints.creamLight,
    },
  });
}
