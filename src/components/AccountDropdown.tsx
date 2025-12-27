import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Wallet, Settings, LogOut, User, LogIn, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AccountDropdown = () => {
  const { user, profile, subscription, signOut, connectWallet, disconnectWallet } = useAuth();
  const navigate = useNavigate();

  const tierColors = {
    free: "bg-muted text-muted-foreground",
    pro: "bg-primary/20 text-primary",
    premium: "bg-gradient-to-r from-primary to-accent text-primary-foreground"
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // If no user, show login button
  if (!user) {
    return (
      <Button 
        onClick={() => navigate('/auth')}
        variant="default"
        className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-smooth shadow-glow"
      >
        <LogIn className="w-4 h-4" />
        <span className="font-medium">Sign In</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-3 h-auto py-2 px-3 hover:bg-secondary/50 transition-smooth"
        >
          <Avatar className="w-8 h-8 border-2 border-primary/30">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-semibold text-sm">
              {getInitials(profile?.display_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-foreground leading-none mb-1">
              {profile?.display_name || "User"}
            </span>
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-0 h-5 ${tierColors[subscription?.tier || 'free']}`}
            >
              {subscription?.tier?.toUpperCase() || "FREE"}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-popover/95 backdrop-blur-xl border-border shadow-elevated"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium text-foreground">
              {profile?.display_name || "User"}
            </p>
            {profile?.email && (
              <p className="text-xs text-muted-foreground truncate">
                {profile.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {profile?.wallet_address ? (
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 transition-smooth">
            <Wallet className="w-4 h-4 text-accent" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs text-muted-foreground">Connected Wallet</span>
              <span className="text-xs font-mono truncate text-foreground">
                {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
              </span>
            </div>
          </DropdownMenuItem>
        ) : null}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => navigate('/pricing')}
          className="cursor-pointer hover:bg-secondary/50 transition-smooth"
        >
          <CreditCard className="w-4 h-4 mr-2 text-primary" />
          <span>Upgrade Plan</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer hover:bg-secondary/50 transition-smooth">
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        
        {profile?.wallet_address ? (
          <DropdownMenuItem 
            onClick={disconnectWallet}
            className="cursor-pointer hover:bg-secondary/50 transition-smooth"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Disconnect Wallet
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={connectWallet}
            className="cursor-pointer hover:bg-secondary/50 transition-smooth"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem className="cursor-pointer hover:bg-secondary/50 transition-smooth">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={signOut}
          className="cursor-pointer text-destructive hover:bg-destructive/10 transition-smooth"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
