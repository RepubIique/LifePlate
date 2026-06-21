import { Directory, File } from "expo-file-system";

/** Ensure a directory exists before writing files beneath it. */
export function ensureDirectory(dir: Directory): void {
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/** Copy a source URI into an existing parent directory, overwriting any prior file. */
export async function copyUriToFile(sourceUri: string, dest: File): Promise<void> {
  ensureDirectory(dest.parentDirectory);
  if (dest.uri === sourceUri) return;
  if (dest.exists) {
    dest.delete();
  }
  await new File(sourceUri).copy(dest, { overwrite: true });
}

/** Download a remote file into a destination file, overwriting any prior copy. */
export async function downloadUrlToFile(url: string, dest: File): Promise<File> {
  ensureDirectory(dest.parentDirectory);
  if (dest.exists) {
    dest.delete();
  }
  return File.downloadFileAsync(url, dest, { idempotent: true });
}

/** Write UTF-8 text to the cache directory, creating or replacing the target file. */
export function writeTextFile(file: File, contents: string): void {
  file.create({ overwrite: true });
  file.write(contents);
}
