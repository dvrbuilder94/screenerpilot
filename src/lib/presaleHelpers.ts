import { ethers } from "ethers";
import { PRESALE_CONFIG, UserContribution } from "@/types/presale";

/**
 * Fetches user contributions to the presale address
 * TODO: Integrate with Base chain explorer API (Basescan) or RPC provider
 * For now, returns mock data structure
 */
export async function fetchUserContributions(
  userAddress: string,
  provider: ethers.BrowserProvider
): Promise<UserContribution> {
  try {
    // TODO: Implement actual on-chain lookup
    // Options:
    // 1. Use Basescan API to query transactions from userAddress to receptionAddress
    // 2. Use event logs if a smart contract is involved
    // 3. Parse transaction history via RPC calls
    
    // Mock data for now - replace with real implementation
    console.log(`Fetching contributions for ${userAddress} to ${PRESALE_CONFIG.receptionAddress}`);
    
    // Placeholder: In production, query the blockchain here
    const totalEthSent = 0;
    const totalUsdcSent = 0;
    
    const alexaiFromEth = totalEthSent / PRESALE_CONFIG.pricePerTokenEth;
    const alexaiFromUsdc = totalUsdcSent / PRESALE_CONFIG.pricePerTokenUsdc;
    const totalAlexai = alexaiFromEth + alexaiFromUsdc;
    
    return {
      totalEthSent,
      totalUsdcSent,
      alexaiFromEth,
      alexaiFromUsdc,
      totalAlexai
    };
  } catch (error) {
    console.error("Error fetching contributions:", error);
    return {
      totalEthSent: 0,
      totalUsdcSent: 0,
      alexaiFromEth: 0,
      alexaiFromUsdc: 0,
      totalAlexai: 0
    };
  }
}

/**
 * Validates if the wallet is connected to Base network
 */
export async function validateBaseNetwork(provider: ethers.BrowserProvider): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    return Number(network.chainId) === PRESALE_CONFIG.baseChainId;
  } catch (error) {
    console.error("Error validating network:", error);
    return false;
  }
}

/**
 * Prompts user to switch to Base network
 */
export async function switchToBaseNetwork(): Promise<void> {
  if (!window.ethereum) throw new Error("No wallet detected");
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${PRESALE_CONFIG.baseChainId.toString(16)}` }],
    });
  } catch (error: any) {
    // Chain not added, attempt to add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${PRESALE_CONFIG.baseChainId.toString(16)}`,
          chainName: 'Base',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org']
        }],
      });
    } else {
      throw error;
    }
  }
}
