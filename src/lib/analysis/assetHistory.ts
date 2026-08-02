// Device-local persistence for the last-seen asset state, so "what changed" can
// compare against the user's previous view. Deliberately localStorage (no
// backend) — matches the app's other device-local state and needs no auth.
import type { AssetState } from "@/lib/analysis/assetChanges";

const key = (symbol: string) => `sp_asset_state_${symbol.toUpperCase()}`;

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
