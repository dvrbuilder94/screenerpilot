import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";

export default function SignUp() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/pricing" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your inbox to confirm your email.");
    navigate("/pricing");
  };

  return (
    <>
      <Seo
        title="Create Account — ScreenerPilot"
        description="Sign up to start your 30-day free trial of ScreenerPilot."
        path="/signup"
      />
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="relative w-full max-w-md p-8">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="absolute right-3 top-3 h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <Link to="/">
              <X className="h-4 w-4" />
            </Link>
          </Button>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Start your 30-day free trial. No charge for 30 days.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1.5">At least 8 characters.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground text-center">
            By signing up you agree to our{" "}
            <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Notice</Link>.
          </p>
        </Card>
      </div>
    </>
  );
}
