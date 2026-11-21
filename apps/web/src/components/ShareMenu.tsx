import { useState } from "react";
import { SOCIAL_LABELS, shareTextForMarket, shareUrl, type SocialNetwork } from "../lib/social";

/**
 * Opt-in share control. Shows the user exactly what would be shared
 * (market title only — never balances, positions, or P&L) and only opens
 * the network's share page when they click a network. Nothing auto-posts.
 */
export default function ShareMenu({
  marketTitle,
  ticker,
  side,
  stake,
}: {
  marketTitle: string;
  ticker?: string;
  side?: "yes" | "no";
  stake?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [parlayCopied, setParlayCopied] = useState(false);
  const text = shareTextForMarket(marketTitle);
  const pageUrl = "https://github.com/Daryl-Walker/Cheeta";
  const parlayUrl =
    ticker && side
      ? `${window.location.origin}/bet/${encodeURIComponent(ticker)}?side=${side}&stake=${encodeURIComponent(stake ?? "10")}`
      : null;

  function copyParlay() {
    if (!parlayUrl) return;
    navigator.clipboard?.writeText(parlayUrl).then(() => setParlayCopied(true)).catch(() => setParlayCopied(false));
  }

  function share(network: SocialNetwork) {
    if (network === "tiktok") {
      // TikTok has no web share-intent URL: copy the text and let the user
      // post it themselves in TikTok if they choose to.
      navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => setCopied(false));
      window.open(shareUrl(network, text, pageUrl), "_blank", "noopener,noreferrer");
      return;
    }
    window.open(shareUrl(network, text, pageUrl), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        aria-expanded={open}
      >
        Share
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <p className="text-xs font-semibold text-slate-900">Share this market</p>
          <p className="mt-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">“{text}”</p>
          <p className="mt-2 text-[11px] leading-4 text-slate-500">
            Only the market title is shared — no balance, position, or P&amp;L.
            Cheeta never posts for you; this just opens the network&apos;s share page.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(SOCIAL_LABELS) as SocialNetwork[]).map((network) => (
              <button
                key={network}
                type="button"
                onClick={() => share(network)}
                className="rounded-full bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                {SOCIAL_LABELS[network]}
              </button>
            ))}
          </div>
          {copied && <p className="mt-2 text-xs text-teal-700">Copied for TikTok — paste it in TikTok if you want to post it.</p>}
          {parlayUrl && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-900">Share this parlay</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                Copy a link to this exact bet ({side} · ${stake ?? "10"} stake). A friend
                who opens it sees the same bet pre-filled and can place it —
                once live betting lands in Milestone 2. No balance or position
                is included in the link.
              </p>
              <button
                type="button"
                onClick={copyParlay}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Copy parlay link
              </button>
              {parlayCopied && <p className="mt-2 text-xs text-teal-700">Parlay link copied.</p>}
            </div>
          )}
          <button type="button" onClick={() => setOpen(false)} className="mt-2 text-xs font-semibold text-slate-500">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
