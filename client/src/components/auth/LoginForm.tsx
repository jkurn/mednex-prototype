import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="max-w-md w-full space-y-6">
      <Card className="shadow-xl border border-slate-200">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="border-t-2 border-slate-300 mb-6"></div>
            <div className="mb-2 flex justify-center items-baseline">
              <h1 className="text-3xl text-text-primary" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', fontWeight: 'bold' }}>Strator MedNex</h1>
              <sup className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-normal ml-2">Demo</sup>
            </div>
            <p className="text-slate-600 text-base mb-4">Health Claims Intelligence Platform</p>
            <div className="border-b-2 border-slate-300 mb-6"></div>

            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200 text-left">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2 flex-shrink-0">ℹ️</span>
                <div className="flex-1">
                  <p className="font-medium text-blue-800 text-sm">Interactive Prototype</p>
                  <p className="text-xs text-blue-700 mt-1">Enter any email and password to explore the demo.</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                required
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                required
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 px-4 rounded-lg font-medium"
              data-testid="button-signin"
            >
              {isLoading ? "Signing In..." : "Sign In to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="border-t-2 border-slate-300 mb-4 mx-8"></div>
        <p className="text-xs text-slate-500">
          Strator MedNex is developed by PT Strator Technologies Indonesia
        </p>
        <div className="border-b-2 border-slate-300 mt-4 mx-8"></div>
      </div>
    </div>
  );
}
