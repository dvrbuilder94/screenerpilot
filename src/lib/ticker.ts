// Turn raw data-provider symbols into something readable.
// ZC=F → ZC · ^VIX → VIX · EURUSD=X → EURUSD · BTC-USD → BTC · DX-Y.NYB → DX-Y
export function cleanTicker(sym: string): string {
  if (!sym) return sym;
  return sym
    .replace(/=F$/i, "")
    .replace(/=X$/i, "")
    .replace(/^\^/, "")
    .replace(/-USD$/i, "")
    .replace(/USDT$/i, "")
    .replace(/\.[A-Z]+$/i, "");
}

// Best label for an asset: prefer the friendly name, fall back to a clean ticker.
export function assetLabel(symbol: string, displayName?: string | null): string {
  if (displayName && displayName.trim() && displayName.toUpperCase() !== symbol.toUpperCase()) {
    return displayName;
  }
  return cleanTicker(symbol);
}
