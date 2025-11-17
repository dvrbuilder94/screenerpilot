import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Copy, Wallet, AlertTriangle, Coins, TrendingUp } from "lucide-react";
import { PRESALE_CONFIG } from "@/types/presale";
import { fetchUserContributions, validateBaseNetwork, switchToBaseNetwork } from "@/lib/presaleHelpers";
import type { UserContribution } from "@/types/presale";

export default function AlexAIPresale() {
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contributions, setContributions] = useState<UserContribution>({
    totalEthSent: 0,
    totalUsdcSent: 0,
    alexaiFromEth: 0,
    alexaiFromUsdc: 0,
    totalAlexai: 0
  });
  const [isBaseNetwork, setIsBaseNetwork] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "No Wallet Detected",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      
      if (accounts.length > 0) {
        setProvider(web3Provider);
        setWalletAddress(accounts[0]);
        
        // Validate network
        const isBase = await validateBaseNetwork(web3Provider);
        setIsBaseNetwork(isBase);
        
        if (!isBase) {
          toast({
            title: "Wrong Network",
            description: "Please switch to Base network to participate",
            variant: "destructive"
          });
        } else {
          // Fetch contributions
          setIsLoading(true);
          const userContribs = await fetchUserContributions(accounts[0], web3Provider);
          setContributions(userContribs);
          setIsLoading(false);
          
          toast({
            title: "Wallet Connected",
            description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
          });
        }
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToBaseNetwork();
      setIsBaseNetwork(true);
      toast({
        title: "Network Switched",
        description: "Successfully switched to Base network"
      });
      
      // Re-fetch contributions
      if (walletAddress && provider) {
        setIsLoading(true);
        const userContribs = await fetchUserContributions(walletAddress, provider);
        setContributions(userContribs);
        setIsLoading(false);
      }
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: "Could not switch to Base network",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
  };

  useEffect(() => {
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          if (provider) {
            fetchUserContributions(accounts[0], provider).then(setContributions);
          }
        } else {
          setWalletAddress("");
          setProvider(null);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, [provider]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Coins className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">AlexAI Token Presale</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          AlexAI is a utility token providing access to the AlexAI Agent ecosystem. 
          This presale allows early contributors to acquire tokens at a fixed price 
          using ETH or USDC on Base network.
        </p>
      </div>

      {/* Main Presale Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Presale Dashboard
          </CardTitle>
          <CardDescription>
            Connect your wallet to view your contributions and estimated AlexAI tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection */}
          {!walletAddress ? (
            <div className="text-center py-8">
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting}
                size="lg"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          ) : (
            <>
              {/* Connected Wallet Info */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Wallet</p>
                  <p className="font-mono font-medium">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                </div>
                {!isBaseNetwork && (
                  <Button onClick={handleSwitchNetwork} variant="outline" size="sm">
                    Switch to Base
                  </Button>
                )}
              </div>

              {/* Network Warning */}
              {!isBaseNetwork && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please switch to Base network to participate in the presale
                  </AlertDescription>
                </Alert>
              )}

              {/* Contribution Stats */}
              {isBaseNetwork && (
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>ETH Contributed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {isLoading ? "..." : contributions.totalEthSent.toFixed(6)} ETH
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ≈ {contributions.alexaiFromEth.toLocaleString()} AlexAI
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>USDC Contributed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {isLoading ? "..." : contributions.totalUsdcSent.toFixed(2)} USDC
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ≈ {contributions.alexaiFromUsdc.toLocaleString()} AlexAI
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary">
                    <CardHeader className="pb-3">
                      <CardDescription>Total AlexAI Tokens</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">
                        {isLoading ? "..." : contributions.totalAlexai.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estimated allocation
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Presale Address */}
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Presale Reception Address</h3>
            <div className="flex items-center gap-2 p-3 bg-muted rounded font-mono text-sm break-all">
              <span className="flex-1">{PRESALE_CONFIG.receptionAddress}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(PRESALE_CONFIG.receptionAddress)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price per Token (ETH)</p>
                <p className="text-lg font-semibold">{PRESALE_CONFIG.pricePerTokenEth} ETH</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price per Token (USDC)</p>
                <p className="text-lg font-semibold">{PRESALE_CONFIG.pricePerTokenUsdc} USDC</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Participate */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Participate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Only send funds from wallets you control (not from exchanges). 
              Use the Base network only.
            </AlertDescription>
          </Alert>
          
          <ol className="space-y-3 list-decimal list-inside">
            <li>Connect your wallet and ensure you're on the Base network</li>
            <li>Send ETH or USDC to the presale address: <code className="bg-muted px-2 py-1 rounded">{PRESALE_CONFIG.receptionAddress}</code></li>
            <li>Your contributions will be tracked automatically</li>
            <li>AlexAI tokens will be allocated off-chain based on total contributions</li>
            <li>Token distribution will be announced separately after presale ends</li>
          </ol>
        </CardContent>
      </Card>

      {/* AlexAI Agent & Token Utility */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AlexAI Agent & Token Utility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-primary">•</span>
              <span>
                <strong>AlexAI Agent</strong> is a virtual AI assistant designed to provide 
                trading insights, market analysis, and automation capabilities
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">•</span>
              <span>
                The <strong>AlexAI token</strong> will be used to access premium agent features, 
                unlock higher usage tiers, and access advanced analytics
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">•</span>
              <span>
                Token holders may participate in governance decisions related to agent 
                configuration and feature priorities
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-primary">•</span>
              <span>
                Future integrations may include API access, custom agent training, 
                and ecosystem expansion utilities
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Disclaimers */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Important Disclaimers
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>
            • This presale is for a <strong>utility token</strong> associated with the AlexAI Agent ecosystem. 
            It is NOT an investment, security, or guarantee of returns.
          </p>
          <p>
            • The AlexAI token provides access to services and features within the platform. 
            There are no promises of profit, price appreciation, or financial gains.
          </p>
          <p>
            • Participation is entirely at your own risk. Only contribute funds you can afford to allocate 
            to accessing future platform utilities.
          </p>
          <p>
            • No guarantees are made regarding future token value, exchange listings, or liquidity.
          </p>
          <p>
            • Token distribution timing and mechanics will be communicated separately. 
            The team reserves the right to adjust presale terms if necessary.
          </p>
          <p>
            • By participating, you acknowledge that you have read and understood these disclaimers 
            and are contributing solely for utility access purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
