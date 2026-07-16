// ── SCRP · ScreenerPilot's Robinhood Chain token ─────────────────────────────
// Hold-to-unlock config. Holding SCRP in a connected wallet unlocks Pro
// features — no per-action transactions, the app just reads the balance.
//
// SAFETY: until SCRP launches on hood.fun, SCRP_ADDRESS is empty and every
// SCRP path stays dark (`isScrpLive()` === false) — zero impact on the current
// app. At launch, paste the deployed contract address below and the gate goes
// live everywhere ProGate is used.

export const RH_CHAIN = {
  id: 4663,
  hexId: "0x1237", // 4663
  name: "Robinhood Chain",
  rpcUrl: "https://rpc.mainnet.chain.robinhood.com",
  explorer: "https://explorer.mainnet.chain.robinhood.com",
  currency: { name: "Ether", symbol: "ETH", decimals: 18 },
} as const;

// ⬇️ Paste the SCRP contract address here after launching on hood.fun.
export const SCRP_ADDRESS = "";

// Connecting the Robinhood Wallet:
//  • Inside the Robinhood Wallet's in-app web3 browser, it injects
//    window.ethereum — the app connects with no extra setup (works today).
//  • From a desktop browser, the Robinhood Wallet connects over WalletConnect
//    (scan a QR). That path is wired at launch: create a free projectId at
//    cloud.reown.com and set VITE_WALLETCONNECT_PROJECT_ID.
export const WALLETCONNECT_PROJECT_ID: string =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? "";

// Minimum SCRP a wallet must hold to unlock Pro. Tune at launch based on price
// (hood.fun tokens are typically 1B supply — 100k is ~0.01%, cheap and open).
export const SCRP_MIN_HOLD = 100_000;
export const SCRP_DECIMALS = 18;

/** True only once a real contract address has been set. Gates all SCRP UI. */
export const isScrpLive = (): boolean => /^0x[0-9a-fA-F]{40}$/.test(SCRP_ADDRESS);

/**
 * Read an ERC-20 balanceOf via a raw JSON-RPC eth_call — no wallet library
 * needed. Returns the balance in whole tokens (floored). 0 if SCRP isn't live
 * or anything goes wrong.
 */
export async function readScrpBalance(wallet: string): Promise<number> {
  if (!isScrpLive() || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) return 0;
  // balanceOf(address) selector 0x70a08231 + 32-byte left-padded address
  const data = "0x70a08231" + wallet.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  try {
    const res = await fetch(RH_CHAIN.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: SCRP_ADDRESS, data }, "latest"],
      }),
    });
    const json = await res.json();
    if (!json?.result || json.result === "0x") return 0;
    const raw = BigInt(json.result);
    return Number(raw / 10n ** BigInt(SCRP_DECIMALS));
  } catch {
    return 0;
  }
}
