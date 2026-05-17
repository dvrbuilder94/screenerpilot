import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ProGateProps {
  children: React.ReactNode;
  /** Show a blurred preview of the children instead of fully hiding */
  preview?: boolean;
  title?: string;
  description?: string;
}

export function ProGate({ children, preview = false, title, description }: ProGateProps) {
  const { user, loading } = useAuth();
  const { isActive, isLoading: subLoading } = useSubscription();

  if (loading || subLoading) {
    return <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  }

  if (isActive) return <>{children}</>;

  const ctaTitle = title || (user ? "Pro feature" : "Sign in to continue");
  const ctaDesc = description || (user
    ? "Start your 30-day free trial to unlock the full terminal."
    : "Create an account to start your 30-day free trial.");

  const overlay = (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="max-w-sm text-center px-6 py-8 rounded-xl border border-border bg-card shadow-sm">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">{ctaTitle}</h3>
        <p className="text-sm text-muted-foreground mb-4">{ctaDesc}</p>
        <Button asChild size="sm" className="w-full">
          <Link to={user ? "/pricing" : "/signup"}>
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            {user ? "Start free trial" : "Sign up free"}
          </Link>
        </Button>
      </div>
    </div>
  );

  if (preview) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>
        {overlay}
      </div>
    );
  }

  return <div className="relative min-h-[280px]">{overlay}</div>;
}
