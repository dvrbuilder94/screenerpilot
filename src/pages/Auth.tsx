import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const { signUp, signIn, verifyOtp, resendOtp, resetPassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signUp(email, password, displayName);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      setPendingEmail(email);
      setShowOtpInput(true);
      toast({
        title: 'Code Sent',
        description: 'Check your email for the verification code.',
      });
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.',
      });
      navigate('/');
    }

    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter the 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOtp(pendingEmail, otpCode);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
    } else {
      toast({
        title: 'Account Verified!',
        description: 'Your account has been created successfully.',
      });
      navigate('/');
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    const { error } = await resendOtp(pendingEmail);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Code Resent',
        description: 'Check your email for the new code.',
      });
    }
    setIsLoading(false);
  };

  const handleBackToSignup = () => {
    setShowOtpInput(false);
    setOtpCode('');
    setPendingEmail('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({
        title: 'Error',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const { error } = await resetPassword(resetEmail);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email Sent',
        description: 'Check your inbox for password reset instructions.',
      });
      setShowForgotPassword(false);
      setResetEmail('');
    }
    setIsLoading(false);
  };

  // OTP Verification Screen
  if (showOtpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to<br />
              <span className="font-medium text-foreground">{pendingEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(value) => setOtpCode(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              className="w-full" 
              onClick={handleVerifyOtp}
              disabled={isLoading || otpCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                variant="link"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-primary"
              >
                Resend Code
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              onClick={handleBackToSignup}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign Up
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Forgot Password Screen
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              onClick={() => setShowForgotPassword(false)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Market Scan</CardTitle>
          <CardDescription className="text-center">
            DuoScan - Professional Trading Analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm text-muted-foreground"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name (optional)</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Free tier: 10 tickers • Pro tier: Unlimited access
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
