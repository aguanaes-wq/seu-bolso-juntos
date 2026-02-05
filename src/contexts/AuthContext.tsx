import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FamilyMember {
  id: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  currentMember: FamilyMember | null;
   sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  members: FamilyMember[];
  fetchMembers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

 const SESSION_TOKEN_KEY = "family_session_token";
 const MEMBER_STORAGE_KEY = "family_member_cache";
 
 // Get the Supabase URL for edge function calls
 const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
   const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from("family_members_safe")
      .select("id, name, created_at")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
  };

  // Load saved member on mount
  useEffect(() => {
     const verifySession = async () => {
      try {
         const savedToken = localStorage.getItem(SESSION_TOKEN_KEY);
         if (savedToken) {
           // Verify session with server
           const response = await fetch(`${SUPABASE_URL}/functions/v1/authenticate`, {
             method: "POST",
             headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ action: "verify", token: savedToken }),
           });
 
           if (response.ok) {
             const data = await response.json();
             if (data.valid && data.member) {
               setCurrentMember(data.member);
               setSessionToken(savedToken);
             } else {
               // Invalid session, clear storage
               localStorage.removeItem(SESSION_TOKEN_KEY);
               localStorage.removeItem(MEMBER_STORAGE_KEY);
             }
          } else {
             // Session verification failed
             localStorage.removeItem(SESSION_TOKEN_KEY);
             localStorage.removeItem(MEMBER_STORAGE_KEY);
          }
        }
      } catch (err) {
         console.error("Error verifying session:", err);
         localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.removeItem(MEMBER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

     verifySession();
    fetchMembers();
  }, []);

  const login = async (name: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
       const response = await fetch(`${SUPABASE_URL}/functions/v1/authenticate`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ action: "login", name, pin }),
       });
 
       const data = await response.json();
 
       if (!response.ok) {
         return { success: false, error: data.error || "Erro ao fazer login" };
      }

       if (!data.token || !data.member) {
         return { success: false, error: "Resposta inválida do servidor" };
      }

       setCurrentMember(data.member);
       setSessionToken(data.token);
       localStorage.setItem(SESSION_TOKEN_KEY, data.token);
       localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(data.member));
      await fetchMembers();

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Erro ao fazer login" };
    }
  };

  const register = async (name: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return { success: false, error: "PIN deve ter 4 números" };
      }

       const response = await fetch(`${SUPABASE_URL}/functions/v1/authenticate`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ action: "register", name, pin }),
       });
 
       const data = await response.json();
 
       if (!response.ok) {
         return { success: false, error: data.error || "Erro ao cadastrar" };
      }

       if (!data.token || !data.member) {
         return { success: false, error: "Resposta inválida do servidor" };
       }
 
       setCurrentMember(data.member);
       setSessionToken(data.token);
       localStorage.setItem(SESSION_TOKEN_KEY, data.token);
       localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(data.member));
      await fetchMembers();

      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Erro ao cadastrar" };
    }
  };

   const logout = async () => {
     // Invalidate session on server
     if (sessionToken) {
       try {
         await fetch(`${SUPABASE_URL}/functions/v1/authenticate`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ action: "logout", token: sessionToken }),
         });
       } catch (err) {
         console.error("Error logging out:", err);
       }
     }
     
    setCurrentMember(null);
     setSessionToken(null);
     localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(MEMBER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentMember,
         sessionToken,
        isAuthenticated: !!currentMember,
        isLoading,
        login,
        logout,
        register,
        members,
        fetchMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
