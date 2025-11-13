import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  wallet_address: string | null;
  display_name: string | null;
  email: string | null;
}

interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro' | 'premium';
  max_tickers: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  connectWallet: () => Promise<{ error: any }>;
  disconnectWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile and subscription data
  const fetchUserData = async (userId: string) => {
    try {
      const [profileRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase.from('user_subscriptions').select('*').eq('user_id', userId).single(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (subRes.data) setSubscription(subRes.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserData(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserData(currentSession.user.id);
      }
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        return { error: 'MetaMask not installed' };
      }

      if (!user) {
        return { error: 'Must be logged in to connect wallet' };
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const walletAddress = accounts[0];

      // Update profile with wallet address
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress })
        .eq('user_id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, wallet_address: walletAddress });
      }

      return { error };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const disconnectWallet = async () => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ wallet_address: null })
      .eq('user_id', user.id);

    if (profile) {
      setProfile({ ...profile, wallet_address: null });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        subscription,
        loading,
        signUp,
        signIn,
        signOut,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
