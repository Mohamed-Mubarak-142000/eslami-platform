import "server-only";
import type { OtherRiwayaKey } from "./riwayat";

/** [surah, ayah, page, juz, text] in the riwaya's own numbering and mushaf pages. */
type RiwayaRow = [number, number, number, number, string];

interface RiwayaFile {
  basmala: string;
  ayahs: RiwayaRow[];
}

const loaded = new Map<OtherRiwayaKey, Promise<RiwayaFile>>();

/** The riwaya's whole mushaf, loaded once per server instance. */
export function loadRiwaya(key: OtherRiwayaKey): Promise<RiwayaFile> {
  let file = loaded.get(key);
  if (!file) {
    file = import(`@/data/riwayat/${key}.json`)
      .then((module: { default: RiwayaFile }) => module.default)
      .catch((error: unknown) => {
        // Let the next request try again instead of keeping the failure.
        loaded.delete(key);
        throw error;
      });
    loaded.set(key, file);
  }
  return file;
}
