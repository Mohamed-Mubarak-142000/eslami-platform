const AYAH_AUDIO_BASE_URL = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";

export function buildAyahAudioUrl(globalAyahNumber: number): string {
  return `${AYAH_AUDIO_BASE_URL}/${globalAyahNumber}.mp3`;
}
