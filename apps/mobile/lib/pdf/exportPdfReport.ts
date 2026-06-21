import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import { Platform, Share } from "react-native";
import type { UserProfile } from "@lifeplate/shared";
import { todayDateKey } from "@lifeplate/shared";
import { buildReportHtml } from "./buildReportHtml";
import { assembleReportData } from "./assembleReportData";
import type { AssembleReportDataOptions } from "./assembleReportData";
import { fetchReportData } from "./fetchReportData";
import { getCachedReportSource, loadReportSource, type ReportSourceBundle, type ReportSourceSeeds } from "./reportSourceCache";

export type ExportPdfOptions = AssembleReportDataOptions & {
  profile: UserProfile;
  source?: ReportSourceBundle;
  seeds?: ReportSourceSeeds;
  force?: boolean;
};

async function sharePdfFile(uri: string, filename: string): Promise<void> {
  if (Platform.OS === "web") {
    const anchor = document.createElement("a");
    anchor.href = uri;
    anchor.download = filename;
    anchor.click();
    return;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Export LifePlate report",
      UTI: "com.adobe.pdf",
    });
    return;
  }

  await Share.share({ url: uri, title: "LifePlate report" });
}

export async function resolveReportData(options: ExportPdfOptions) {
  const { profile, source, seeds, force, ...assembleOptions } = options;
  if (source) {
    return assembleReportData(profile, source, assembleOptions);
  }

  const cached = !force ? getCachedReportSource(profile.id) : null;
  if (cached) {
    return assembleReportData(profile, cached, assembleOptions);
  }

  return fetchReportData(profile, options);
}

export async function exportPdfReport(options: ExportPdfOptions): Promise<void> {
  const data = await resolveReportData(options);
  const html = buildReportHtml(data);
  const filename = `lifeplate-trend-report-${todayDateKey()}.pdf`;

  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === "web") {
    await sharePdfFile(uri, filename);
    return;
  }

  try {
    const dest = new File(Paths.cache, filename);
    if (dest.exists) {
      dest.delete();
    }
    await new File(uri).copy(dest, { overwrite: true });
    await sharePdfFile(dest.uri, filename);
  } catch {
    await sharePdfFile(uri, filename);
  }
}

/** Build HTML for in-app preview — prefers cached source, no duplicate network calls. */
export async function buildReportPreviewHtml(options: ExportPdfOptions): Promise<string> {
  const data = await resolveReportData(options);
  return buildReportHtml(data);
}

/** Preload meals + hydration once when the export sheet opens. */
export function preloadReportSource(
  profile: UserProfile,
  seeds?: ExportPdfOptions["seeds"],
): Promise<import("./reportSourceCache").ReportSourceBundle> {
  return loadReportSource(profile, { seeds });
}
