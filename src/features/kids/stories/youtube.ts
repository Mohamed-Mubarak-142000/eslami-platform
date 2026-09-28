const ID = /^[A-Za-z0-9_-]{11}$/;

/** Accepts a bare video id or any common YouTube link (watch, youtu.be, shorts, embed, live). */
export function parseYoutubeId(input: string): string | null {
  const value = input.trim();
  if (ID.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www\.|m\.)/, "");
    if (host === "youtu.be") return matchId(url.pathname.slice(1));
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) return matchId(fromQuery);
      const [, kind, id] = url.pathname.split("/");
      if (kind && ["shorts", "embed", "live", "v"].includes(kind) && id) return matchId(id);
    }
  } catch {
    // Not a URL.
  }
  return null;
}

function matchId(candidate: string): string | null {
  return ID.test(candidate) ? candidate : null;
}

export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
