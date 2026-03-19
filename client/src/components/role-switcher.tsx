import { useAuth, UserRole } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Users, Shield, BarChart3, Settings } from "lucide-react";

const roles: { role: UserRole; label: string; description: string; icon: typeof Users; route: string }[] = [
  { role: "analis", label: "Analis Klaim", description: "Dewi — Claims Adjuster", icon: Users, route: "/dashboard" },
  { role: "kepala", label: "Kepala Klaim", description: "Pak Rahman — Team Lead", icon: Shield, route: "/kepala" },
  { role: "manajer", label: "Manajer Klaim", description: "Ibu Kartini — Executive", icon: BarChart3, route: "/manajer" },
  { role: "admin", label: "Admin System", description: "System Administrator", icon: Settings, route: "/dashboard" },
];

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-[var(--sidebar)] rounded-2xl shadow-xl border border-[var(--sidebar-border)] p-4 space-y-2 min-w-[280px]">
        <p className="text-[10px] font-semibold tracking-[2px] text-[var(--sidebar-foreground)] font-mono px-2 mb-3">
          SWITCH PERSONA
        </p>
        {roles.map(({ role, label, description, icon: Icon, route }) => (
          <button
            key={role}
            onClick={() => {
              switchRole(role);
              navigate(route);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
              user?.role === role
                ? "bg-[var(--sidebar-accent)] text-[#FEFCF4]"
                : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]"
            }`}
          >
            <Icon className={`w-4 h-4 ${user?.role === role ? "text-[var(--primary)]" : ""}`} />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs opacity-60">{description}</p>
            </div>
            {user?.role === role && (
              <span className="ml-auto text-[10px] bg-[var(--primary)] text-white px-2 py-0.5 rounded-full font-semibold">
                Active
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
