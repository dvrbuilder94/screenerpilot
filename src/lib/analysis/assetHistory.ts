// Device-local persistence for the last-seen asset state, so "what changed" can
// compare against the user's previous view. Deliberately localStorage (no
// backend) — matches the app's other device-local state and needs no auth.
import type { AssetChange, AssetState } from "@/lib/analysis/assetChanges";

const key = (symbol: string) => `sp_asset_state_${symbol.toUpperCase()}`;
const changeKey = (symbol: string) => `sp_asset_change_${symbol.toUpperCase()}`;

export interface AssetChangeDigest {
  changes: AssetChange[];
  since: string;
  detectedAt: string;
}

export function loadAssetState(symbol: string): AssetState | null {
  try {
    const raw = localStorage.getItem(key(symbol));
    return raw ? (JSON.parse(raw) as AssetState) : null;
  } catch {
    return null;
  }
}

export function saveAssetState(symbol: string, state: AssetState): void {
  try {
    localStorage.setItem(key(symbol), JSON.stringify(state));
  } catch {
    /* storage full or unavailable — non-critical */
  }
}

export function loadAssetChangeDigest(symbol: string): AssetChangeDigest | null {
  try {
    const raw = localStorage.getItem(changeKey(symbol));
    return raw ? (JSON.parse(raw) as AssetChangeDigest) : null;
  } catch {
    return null;
  }
}

/** Keep the latest meaningful change visible in Watchlist until a newer one is detected. */
export function saveAssetChangeDigest(symbol: string, digest: AssetChangeDigest): void {
  try {
    localStorage.setItem(changeKey(symbol), JSON.stringify(digest));
  } catch {
    /* storage full or unavailable — non-critical */
  }
}
