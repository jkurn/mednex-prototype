import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import KepalaDashboard from "@/pages/kepala-dashboard";
import ManajerDashboard from "@/pages/manajer-dashboard";
import ProcessingFeed from "@/pages/processing-feed";
import Reports from "@/pages/reports";
import NeedsAttentionPage from "@/pages/needs-attention";
import PemegangPolisPage from "@/pages/pemegang-polis";
import DaftarPesertaPage from "@/pages/daftar-peserta";
import ProviderTarifPage from "@/pages/provider-tarif";
import ProviderDetailPage from "@/pages/provider-detail";
import UserSettings from "@/pages/user-settings";
import AdminSettings from "@/pages/admin-settings";
import PolicyDetailPage from "@/pages/policy-detail";
import DaftarPolisPage from "@/pages/daftar-polis";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./hooks/useAuth";
import { ClaimsProvider } from "./hooks/useClaimsData";
import { SettingsModalProvider, useSettingsModal } from "./hooks/useSettingsModal";
import { RoleSwitcher } from "@/components/role-switcher";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/kepala" component={KepalaDashboard} />
      <Route path="/manajer" component={ManajerDashboard} />
      <Route path="/processing" component={ProcessingFeed} />
      <Route path="/reports" component={Reports} />
      <Route path="/klaim" component={NeedsAttentionPage} />
      <Route path="/klaim/:id" component={NeedsAttentionPage} />
      <Route path="/needs-attention" component={NeedsAttentionPage} />
      <Route path="/pemegang-polis" component={PemegangPolisPage} />
      <Route path="/daftar-peserta" component={DaftarPesertaPage} />
      <Route path="/daftar-polis" component={DaftarPolisPage} />
      <Route path="/provider-tarif" component={ProviderTarifPage} />
      <Route path="/provider/:id" component={ProviderDetailPage} />
      <Route path="/polis/:policyId" component={PolicyDetailPage} />
      <Route path="/settings/user" component={UserSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SettingsModalOverlay() {
  const { isOpen } = useSettingsModal();
  if (!isOpen) return null;
  return <AdminSettings />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ClaimsProvider>
            <SettingsModalProvider>
              <Toaster />
              <Router />
              <RoleSwitcher />
              <SettingsModalOverlay />
            </SettingsModalProvider>
          </ClaimsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
