import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, UserPlus, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Mode = "select" | "login" | "register";

export function LoginPage() {
  const { login, register, members, isLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("select");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectMember = (name: string) => {
    setSelectedMember(name);
    setMode("login");
    setError("");
    setPin("");
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError("Digite os 4 números do PIN");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await login(selectedMember, pin);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Erro ao fazer login");
      setPin("");
    }
  };

  const handleRegister = async () => {
    if (!newName.trim()) {
      setError("Digite seu nome");
      return;
    }

    if (pin.length !== 4) {
      setError("Digite os 4 números do PIN");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await register(newName.trim(), pin);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Erro ao cadastrar");
      setPin("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Agente Financeiro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "select" && "Quem está usando?"}
              {mode === "login" && `Olá, ${selectedMember}!`}
              {mode === "register" && "Cadastre-se para começar"}
            </p>
          </div>

          {/* Member Selection */}
          {mode === "select" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member) => (
                    <Button
                      key={member.id}
                      variant="outline"
                      className="w-full h-14 justify-start gap-3 text-lg"
                      onClick={() => handleSelectMember(member.name)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      {member.name}
                    </Button>
                  ))}
                </div>
              )}

              {members.length < 2 && (
                <>
                  {members.length > 0 && (
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          ou
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="default"
                    className="w-full h-14 gap-2 text-lg"
                    onClick={() => {
                      setMode("register");
                      setError("");
                      setPin("");
                    }}
                  >
                    <UserPlus className="w-5 h-5" />
                    Novo membro da família
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Label className="text-sm text-muted-foreground">
                  Digite seu PIN de 4 números
                </Label>
                <div className="flex justify-center mt-4">
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={setPin}
                    disabled={isSubmitting}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full h-12 gap-2"
                  onClick={handleLogin}
                  disabled={isSubmitting || pin.length !== 4}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Entrar
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMode("select");
                    setPin("");
                    setError("");
                  }}
                >
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Maria"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Crie um PIN de 4 números
                  </Label>
                  <div className="flex justify-center mt-2">
                    <InputOTP
                      maxLength={4}
                      value={pin}
                      onChange={setPin}
                      disabled={isSubmitting}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full h-12 gap-2"
                  onClick={handleRegister}
                  disabled={isSubmitting || !newName.trim() || pin.length !== 4}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Cadastrar
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setMode("select");
                    setPin("");
                    setNewName("");
                    setError("");
                  }}
                >
                  Voltar
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
