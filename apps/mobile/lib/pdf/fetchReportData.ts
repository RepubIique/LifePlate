import type { UserProfile } from "@lifeplate/shared";
import { assembleReportData } from "./assembleReportData";
import type { AssembleReportDataOptions } from "./assembleReportData";
import {
  loadReportSource,
  type ReportSourceBundle,
  type ReportSourceSeeds,
} from "./reportSourceCache";

export type FetchReportDataOptions = AssembleReportDataOptions & {
  /** Reuse a loaded source bundle (preview session, export after preview). */
  source?: ReportSourceBundle;
  /** Skip network when possible — hydrate from app contexts / secure-store caches. */
  seeds?: ReportSourceSeeds;
  force?: boolean;
};

export { assembleReportData };

export async function fetchReportData(
  profile: UserProfile,
  options?: FetchReportDataOptions,
): Promise<import("./types").PdfReportData> {
  const source =
    options?.source ??
    (await loadReportSource(profile, {
      seeds: options?.seeds,
      force: options?.force,
    }));

  return assembleReportData(profile, source, options);
}
