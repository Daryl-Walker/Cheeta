import { useState } from "react";
import { loadFollowed, saveFollowed, type DemoTrader } from "../lib/social";

/**
 * Follow button — UI only in Milestone 1. Tapping it stores the follow in
 * this browser only; there is no friends/follow backend yet (Milestone 2).
 * Follower counts shown are sample numbers.
 */
export default function FollowButton({
  trader,
  compact = false,
}: {
  trader: DemoTrader;
  compact?: boolean;
}) {
  const [followed, setFollowed] = useState<string[]>(() => loadFollowed());
  const isFollowing = followed.includes(trader.handle);

  function toggle() {
    const next = isFollowing
      ? followed.filter((h) => h !== trader.handle)
      : [...followed, trader.handle];
    setFollowed(next);
    saveFollowed(next);
  }

  const count = trader.followers + (isFollowing ? 1 : 0);

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isFollowing}
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          isFollowing ? "bg-slate-100 text-slate-700 border border-slate-200" : "bg-[#2563eb] text-white"
        } ${compact ? "px-2 py-0.5" : ""}`}
      >
        {isFollowing ? "Following" : "Follow"}
      </button>
      <span className="text-xs text-slate-500" title="Sample follower count — no follow backend yet">
        {count.toLocaleString()} followers · sample
      </span>
    </span>
  );
}
