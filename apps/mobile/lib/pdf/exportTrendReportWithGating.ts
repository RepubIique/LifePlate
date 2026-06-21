import type { UserProfile } from "@lifeplate/shared";
import { exportPdfReport, type ExportPdfOptions } from "@/lib/pdf/exportPdfReport";
import type { ReportSourceBundle } from "@/lib/pdf/reportSourceCache";

type ExportTrendReportOptions = {
  profile: UserProfile;
  refreshProfile: () => Promise<UserProfile | null>;
  openPaywall: (featureId: "pdf_export", onClose?: () => void) => void;
  source?: ReportSourceBundle;
} & Omit<ExportPdfOptions, "profile" | "fullReport">;

export async function exportTrendReportWithGating({
  profile,
  refreshProfile,
  openPaywall,
  source,
  ...exportOptions
}: ExportTrendReportOptions): Promise<{ fullReport: boolean }> {
  if (profile.isPaid) {
    await exportPdfReport({ profile, fullReport: true, source, ...exportOptions });
    return { fullReport: true };
  }

  return new Promise((resolve, reject) => {
    openPaywall("pdf_export", () => {
      void (async () => {
        try {
          const updated = (await refreshProfile()) ?? profile;
          const fullReport = updated.isPaid;
          await exportPdfReport({ profile: updated, fullReport, source, ...exportOptions });
          resolve({ fullReport });
        } catch (error) {
          reject(error);
        }
      })();
    });
  });
}
