import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        sessionStorage.removeItem('dashboardScrollPosition');

        toast({
          title: "Login Successful",
          description: "Welcome to Strator MedNex",
        });
        setLocation("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const success = await login("demo@mednex.id", "demo");
      if (success) {
        sessionStorage.removeItem('dashboardScrollPosition');
        toast({
          title: "Login Successful",
          description: "Welcome to Strator MedNex",
        });
        setLocation("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full" style={{ maxWidth: 400 }}>
      {/* Title */}
      <h2
        className="text-heading-xl font-bold mb-2"
        style={{
          color: "var(--sand-200)",
          fontFamily: "var(--font-display)",
        }}
      >
        Selamat datang kembali
      </h2>
      <p
        className="text-body-m mb-8"
        style={{ color: "var(--sand-600)" }}
      >
        Masuk ke akun MedNex Anda
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label
            htmlFor="email"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--sand-200)" }}
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.co.id"
            className="w-full px-4 py-3 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--sand-800)",
              color: "var(--sand-200)",
            }}
            required
            data-testid="input-email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: "var(--sand-200)" }}
            >
              Password
            </Label>
            <button
              type="button"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--orange-600)" }}
            >
              Lupa Password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan password Anda"
            className="w-full px-4 py-3 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid var(--sand-800)",
              color: "var(--sand-200)",
            }}
            required
            data-testid="input-password"
          />
        </div>

        {/* Primary submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-lg font-semibold text-white"
          style={{
            backgroundColor: "var(--orange-600)",
            borderRadius: 8,
          }}
          data-testid="button-signin"
        >
          {isLoading ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      {/* Demo button */}
      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading}
        className="w-full mt-3 py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:bg-sand-1000"
        style={{
          border: "1px solid var(--sand-800)",
          borderRadius: 8,
          color: "var(--sand-200)",
          backgroundColor: "transparent",
        }}
      >
        Masuk dengan akun demo
      </button>

      {/* Info box */}
      <div
        className="mt-6 p-4 rounded-lg flex items-start gap-3"
        style={{
          backgroundColor: "#EFF6FF",
          border: "1px solid #BFDBFE",
        }}
      >
        <svg
          className="flex-shrink-0 mt-0.5"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <div>
          <p className="text-sm font-medium" style={{ color: "#1E40AF" }}>
            Interactive Prototype
          </p>
          <p className="text-xs mt-1" style={{ color: "#1D4ED8" }}>
            Enter any email and password to explore the platform.
          </p>
        </div>
      </div>
    </div>
  );
}
