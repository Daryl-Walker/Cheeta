/**
 * Social affordances — first pass, Milestone 1.
 *
 * - Sharing is opt-in, per card, and never automatic. Nothing is posted by
 *   Cheeta itself: a share action only opens the network's standard share
 *   page in a new tab, after the user confirms what will be shared.
 * - By default a share includes ONLY the public market title — never an
 *   account balance, position size, P&L, or any credential. The UI says so.
 * - No social login, no Facebook/TikTok/X SDKs, no social credentials are
 *   stored. Profile links are plain URLs the user types in, kept only in
 *   this browser's localStorage.
 */

export type SocialNetwork = "facebook" | "x" | "tiktok";

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  x: "X",
  tiktok: "TikTok",
};

export function shareUrl(network: SocialNetwork, text: string, url: string): string {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  if (network === "facebook") {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  }
  if (network === "x") {
    return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  }
  // TikTok has no public web share-intent URL for a text post. The TikTok
  // action copies the text and opens tiktok.com — the user posts it
  // themselves, in TikTok, if they choose to.
  return "https://www.tiktok.com/";
}

export function shareTextForMarket(marketTitle: string): string {
  return `Watching on Cheeta: ${marketTitle}`;
}

export interface SocialLinks {
  facebook: string;
  tiktok: string;
  x: string;
}

const STORAGE_KEY = "cheeta-social-links";

export function loadSocialLinks(): SocialLinks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { facebook: "", tiktok: "", x: "" };
    const parsed = JSON.parse(raw) as Partial<SocialLinks>;
    return {
      facebook: typeof parsed.facebook === "string" ? parsed.facebook : "",
      tiktok: typeof parsed.tiktok === "string" ? parsed.tiktok : "",
      x: typeof parsed.x === "string" ? parsed.x : "",
    };
  } catch {
    return { facebook: "", tiktok: "", x: "" };
  }
}

export function saveSocialLinks(links: SocialLinks): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Following inside Cheeta — UI only in Milestone 1.
 *
 * There is NO friends/follow backend yet: the traders below are sample
 * data, follower counts are sample numbers, and a Follow tap is stored
 * only in this browser's localStorage. A real follow graph (who follows
 * whom, persisted per account, activity feeds) is a Milestone 2 backend
 * item. The UI labels all of this as sample.
 */
export interface DemoTrader {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
}

export const DEMO_TRADERS: DemoTrader[] = [
  { handle: "@maya-markets", name: "Maya", bio: "Fed + inflation watcher", followers: 1240, following: 86 },
  { handle: "@odds-watcher", name: "Sam", bio: "Odds moves, all day", followers: 863, following: 142 },
  { handle: "@contrarian-cal", name: "Cal", bio: "Takes the other side", followers: 412, following: 97 },
];

/** Deterministically assign a sample author to a market, by ticker. */
export function authorForTicker(ticker: string): DemoTrader {
  let hash = 0;
  for (const ch of ticker) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return DEMO_TRADERS[hash % DEMO_TRADERS.length];
}

const FOLLOWS_KEY = "cheeta-follows";

export function loadFollowed(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FOLLOWS_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveFollowed(handles: string[]): void {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(handles));
}
