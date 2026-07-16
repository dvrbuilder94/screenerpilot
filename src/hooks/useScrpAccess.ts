import { useState, useEffect, useCallback } from "react";
import { RH_CHAIN, SCRP_MIN_HOLD, readScrpBalance, isScrpLive } from "@/lib/scrp";

// Links an injected wallet (MetaMask etc.) and reads its SCRP balance so the app
// can unlock Pro for holders. No wallet library — just window.ethereum + a raw
// balance read. The connected address is remembered locally so access sticks.
const WALLET_KEY = "sp_scrp_wallet";

export interface ScrpAccess {
  live: boolean;
  wallet: string | null;
  balance: number | null;
  connecting: boolean;
  error: string | null;
  hasAccess: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useScrpAccess(): ScrpAccess {
  const [wallet, setWallet] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(WALLET_KEY);
    if (saved) setWallet(saved);
  }, []);

  useEffect(() => {
    if (!wallet) return;
    let alive = true;
    readScrpBalance(wallet).then((b) => alive && setBalance(b));
    return () => {
      alive = false;
    };
  }, [wallet]);

  const connect = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      setError("No wallet found. Install MetaMask to hold SCRP.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const addr = accounts?.[0];
      if (!addr) throw new Error("No account selected");
      // Best-effort switch to Robinhood Chain — ignore if the user declines.
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: RH_CHAIN.hexId }] });
      } catch {
        /* user can switch manually */
      }
      localStorage.setItem(WALLET_KEY, addr);
      setWallet(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(WALLET_KEY);
    setWallet(null);
    setBalance(null);
    setError(null);
  }, []);

  const hasAccess = isScrpLive() && balance !== null && balance >= SCRP_MIN_HOLD;

  return { live: isScrpLive(), wallet, balance, connecting, error, hasAccess, connect, disconnect };
}
