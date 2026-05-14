import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WalletComingSoonProps {
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export const WalletComingSoon = ({
  size = "sm",
  variant = "outline",
  className = "",
}: WalletComingSoonProps) => {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={`gap-2 font-medium ${className}`}
      onClick={() =>
        toast("Wallet connect — Beta", {
          description: "On-chain features are launching soon. Stay tuned.",
        })
      }
    >
      <Wallet className="w-3.5 h-3.5" />
      <span>Connect Wallet</span>
      <span className="ml-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
        Beta
      </span>
    </Button>
  );
};
