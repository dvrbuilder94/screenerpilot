import { useState, useEffect, useCallback } from "react";
import { RH_CHAIN, SCRP_MIN_HOLD, readScrpBalance, isScrpLive } from "@/lib/scrp";

// Links the Robinhood Wallet (or any injected EVM wallet) and reads its SCRP
// balance so the app can unlock Pro for holders. Inside the Robinhood Wallet's
// in-app web3 browser, window.ethereum is injected and this works with no extra
// setup; desktop QR connection over WalletConnect is added at launch. No wallet
// library — just window.ethereum + a raw balance read. The connected address is
// remembered locally so access sticks.
const WALLET_KEY = "sp_scrp_wallet";

type InjectedProvider = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };

const getInjected = (): InjectedProvider | undefined =>
  (window as unknown as { ethereum?: InjectedProvider }).ethereum;

export interface ScrpAccess {
  live: boolean;
  /** An injected wallet is available (e.g. inside the Robinhood Wallet browser). */
  hasInjected: boolean;
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
    const eth = getInjected();
    if (!eth) {
      setError("Open ScreenerPilot inside the Robinhood Wallet browser to connect.");
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

  return { live: isScrpLive(), hasInjected: !!getInjected(), wallet, balance, connecting, error, hasAccess, connect, disconnect };
}
