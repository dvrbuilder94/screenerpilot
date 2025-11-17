export interface PresaleConfig {
  receptionAddress: string;
  pricePerTokenEth: number;
  pricePerTokenUsdc: number;
  baseChainId: number;
  usdcContractAddress: string;
}

export interface UserContribution {
  totalEthSent: number;
  totalUsdcSent: number;
  alexaiFromEth: number;
  alexaiFromUsdc: number;
  totalAlexai: number;
}

export const PRESALE_CONFIG: PresaleConfig = {
  receptionAddress: "0x0b689680811826d84a3bac3ee0d344445dc15e45",
  pricePerTokenEth: 0.0001, // 0.0001 ETH per AlexAI token
  pricePerTokenUsdc: 0.10,  // 0.10 USDC per AlexAI token
  baseChainId: 8453, // Base mainnet
  usdcContractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" // USDC on Base
};
