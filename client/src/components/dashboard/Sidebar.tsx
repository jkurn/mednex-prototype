import { FileText, Settings, User, CreditCard, Users, BookOpen } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useSettingsModal } from "@/hooks/useSettingsModal";

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  action?: () => void;
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const [location] = useLocation();
  const { openSettings } = useSettingsModal();

  const menuCategories: MenuCategory[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      items: [
        {
          id: "klaim",
          label: "Klaim",
          icon: FileText,
          path: "/dashboard"
        },
        {
          id: "pemegang-polis",
          label: "Polis & Peserta",
          icon: Users,
          path: "/pemegang-polis"
        },
        {
          id: "provider-tarif",
          label: "Provider & Buku Tarif",
          icon: BookOpen,
          path: "/provider-tarif"
        }
      ]
    },
    {
      id: "pengaturan",
      label: "Pengaturan",
      items: [
        {
          id: "admin",
          label: "Pengaturan",
          icon: Settings,
          action: openSettings
        }
      ]
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Workspace Header */}
      <div className="px-3 py-3 border-b border-gray-200">
        <h1 className="text-xs font-semibold text-gray-900 leading-tight">
          PT Asuransi ABC Indonesia
        </h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Workspace</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {menuCategories.map((category) => (
          <div key={category.id} className="mb-4">
            <h3 className="px-2 mb-1 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {category.label}
            </h3>
            <ul className="space-y-0.5">
              {category.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path ? location === item.path : false;
                
                if (item.action) {
                  return (
                    <li key={item.id}>
                      <button
                        onClick={item.action}
                        data-testid={`nav-${item.id}`}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                }
                
                return (
                  <li key={item.id}>
                    <Link
                      href={item.path!}
                      data-testid={`nav-${item.id}`}
                      onClick={() => {
                        if (item.path !== '/dashboard') {
                          sessionStorage.removeItem('dashboardScrollPosition');
                        }
                      }}
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors text-xs
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer - Strator Branding */}
      <div className="px-3 py-3 border-t border-gray-200">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h1 className="text-xs font-bold text-gray-900">Strator MedNex</h1>
          <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-normal">Demo</span>
        </div>
        <p className="text-[10px] text-gray-500">Health Claims Intelligence Platform</p>
      </div>
    </div>
  );
}
