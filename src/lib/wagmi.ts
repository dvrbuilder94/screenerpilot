import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'ScreenerPilot',
  // Public WalletConnect Cloud project id (replace with your own for production)
  projectId: 'a8353cdb5f76e3a2ec5a2c1f7c1b0a7c',
  chains: [base, baseSepolia],
  ssr: false,
});
