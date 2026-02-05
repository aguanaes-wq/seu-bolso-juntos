import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FamilyMember {
  id: string;
  name: string;
  created_at: string;
}

interface AuthContextType {
  currentMember: FamilyMember | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (name: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  members: FamilyMember[];
  fetchMembers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple hash function for PIN (client-side - not cryptographically secure but ok for family app)
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

const MEMBER_STORAGE_KEY = "family_member";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentMember, setCurrentMember] = useState<FamilyMember | null>(null);
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
    const loadSavedMember = async () => {
      try {
        const saved = localStorage.getItem(MEMBER_STORAGE_KEY);
        if (saved) {
          const member = JSON.parse(saved) as FamilyMember;
          // Verify member still exists
          const { data } = await supabase
            .from("family_members_safe")
            .select("id, name, created_at")
            .eq("id", member.id)
            .single();

          if (data) {
            setCurrentMember(data);
          } else {
            localStorage.removeItem(MEMBER_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error("Error loading saved member:", err);
        localStorage.removeItem(MEMBER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedMember();
    fetchMembers();
  }, []);

  const login = async (name: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const pinHash = hashPin(pin);

      // Use secure RPC function to verify PIN without exposing hash
      const { data, error } = await supabase
        .rpc("verify_member_pin", {
          member_name: name,
          pin_hash_input: pinHash,
        });

      if (error) {
        console.error("Login error:", error);
        return { success: false, error: "Erro ao fazer login" };
      }

      if (!data || data.length === 0) {
        return { success: false, error: "Nome ou PIN incorreto" };
      }

      const memberData = data[0];
      const member: FamilyMember = {
        id: memberData.id,
        name: memberData.name,
        created_at: memberData.created_at,
      };

      setCurrentMember(member);
      localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
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

      const pinHash = hashPin(pin);

      const { data, error } = await supabase
        .from("family_members")
        .insert({ name, pin_hash: pinHash })
        .select("id, name, created_at")
        .single();

      if (error) {
        if (error.code === "23505") {
          return { success: false, error: "Nome já cadastrado" };
        }
        throw error;
      }

      const member: FamilyMember = {
        id: data.id,
        name: data.name,
        created_at: data.created_at,
      };

      setCurrentMember(member);
      localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(member));
      await fetchMembers();

      return { success: true };
    } catch (err) {
      console.error("Register error:", err);
      return { success: false, error: "Erro ao cadastrar" };
    }
  };

  const logout = () => {
    setCurrentMember(null);
    localStorage.removeItem(MEMBER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        currentMember,
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
