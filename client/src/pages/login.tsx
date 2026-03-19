import { useEffect } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Ensure scroll to top on fresh login
      window.scrollTo(0, 0);
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-slate-100 px-4">
      <LoginForm />
    </div>
  );
}
