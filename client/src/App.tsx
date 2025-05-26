import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import RabbitInventory from "@/pages/RabbitInventory";
import BreedingRecords from "@/pages/BreedingRecords";
import Health from "@/pages/Health";
import FeedManagement from "@/pages/FeedManagement";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import Settings from "@/pages/Settings";
import Layout from "@/components/Layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import AuthProtection from "@/components/AuthProtection";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <AuthProtection>
          <Dashboard />
        </AuthProtection>
      </Route>
      
      <Route path="/dashboard">
        <AuthProtection>
          <Dashboard />
        </AuthProtection>
      </Route>
      
      <Route path="/rabbits">
        <AuthProtection>
          <RabbitInventory />
        </AuthProtection>
      </Route>
      
      <Route path="/breeding">
        <AuthProtection>
          <BreedingRecords />
        </AuthProtection>
      </Route>
      
      <Route path="/health">
        <AuthProtection>
          <Health />
        </AuthProtection>
      </Route>
      
      <Route path="/feed">
        <AuthProtection>
          <FeedManagement />
        </AuthProtection>
      </Route>
      
      <Route path="/reports">
        <AuthProtection>
          <Reports />
        </AuthProtection>
      </Route>
      
      <Route path="/users">
        <AuthProtection roles={["admin", "manager"]}>
          <UserManagement />
        </AuthProtection>
      </Route>
      
      <Route path="/settings">
        <AuthProtection>
          <Settings />
        </AuthProtection>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <AuthProvider>
          <TooltipProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}

export default App;
