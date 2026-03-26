import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tracks whether the initial getSession() bootstrap has completed.
  // onAuthStateChange fires immediately on mount (INITIAL_SESSION / SIGNED_IN),
  // which races with getSession(). We ignore that first event and let
  // getSession() be the single source of truth for the initial load.
  const initializedRef = useRef(false);

  useEffect(() => {
    // ── 1. Bootstrap: restore session from storage ──────────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          initializedRef.current = true;
          setLoading(false);
        });
      } else {
        initializedRef.current = true;
        setLoading(false);
      }
    });

    // ── 2. Keep in sync after bootstrap ─────────────────────────────────────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip the synthetic event that fires on mount — getSession() handles that.
      if (!initializedRef.current) return;

      (async () => {
        setUser(session?.user ?? null);

        if (session?.user) {
          // Block unauthorized Google sign-ins
          if (
            event === "SIGNED_IN" &&
            session.user.app_metadata?.provider === "google"
          ) {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("email", session.user.email)
              .maybeSingle();

            if (!existingProfile) {
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
              setLoading(false);
              window.location.href = "/signin?error=unauthorized";
              return;
            }

            setProfile(existingProfile);
            return;
          }

          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
    // NOTE: setLoading(false) is intentionally NOT here anymore.
    // Loading is only ever controlled by the bootstrap in useEffect
    // to avoid the race condition.
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setProfile(null);
    }
    return { error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
