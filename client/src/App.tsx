import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import ProductsPage from "@/pages/products";
import AddProductPage from "@/pages/products/add-product";
import CustomersPage from "@/pages/customers";
import AddCustomerPage from "@/pages/customers/add-customer";
import VendorsPage from "@/pages/vendors";
import AddVendorPage from "@/pages/vendors/add-vendor";
import PurchaseOrdersPage from "@/pages/purchase-orders";
import AddPurchasePage from "@/pages/purchase-orders/add-purchase";
import SalesOrdersPage from "@/pages/sales-orders";
import AddSalePage from "@/pages/sales-orders/add-sale";
import ReturnsPage from "@/pages/returns";
import AddReturnPage from "@/pages/returns/add-return";
import AccountsPayablePage from "@/pages/reports/accounts-payable";
import AccountsReceivablePage from "@/pages/reports/accounts-receivable";
import InventoryReportPage from "@/pages/reports/inventory";
import ProfitLossPage from "@/pages/reports/profit-loss";
import SalesReportPage from "@/pages/reports/sales-report";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Dashboard */}
      <ProtectedRoute path="/" component={Dashboard} />
      
      {/* Master Data Management */}
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/add" component={AddProductPage} />
      <ProtectedRoute path="/products/edit/:id" component={AddProductPage} />
      
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/customers/add" component={AddCustomerPage} />
      <ProtectedRoute path="/customers/edit/:id" component={AddCustomerPage} />
      
      <ProtectedRoute path="/vendors" component={VendorsPage} />
      <ProtectedRoute path="/vendors/add" component={AddVendorPage} />
      <ProtectedRoute path="/vendors/edit/:id" component={AddVendorPage} />
      
      {/* Transactions */}
      <ProtectedRoute path="/purchase-orders" component={PurchaseOrdersPage} />
      <ProtectedRoute path="/purchase-orders/add" component={AddPurchasePage} />
      <ProtectedRoute path="/purchase-orders/:id" component={AddPurchasePage} />
      
      <ProtectedRoute path="/sales-orders" component={SalesOrdersPage} />
      <ProtectedRoute path="/sales-orders/add" component={AddSalePage} />
      <ProtectedRoute path="/sales-orders/:id" component={AddSalePage} />
      
      <ProtectedRoute path="/returns" component={ReturnsPage} />
      <ProtectedRoute path="/returns/add" component={AddReturnPage} />
      <ProtectedRoute path="/returns/:id" component={AddReturnPage} />
      
      {/* Reports */}
      <ProtectedRoute path="/reports/accounts-payable" component={AccountsPayablePage} />
      <ProtectedRoute path="/reports/accounts-receivable" component={AccountsReceivablePage} />
      <ProtectedRoute path="/reports/inventory" component={InventoryReportPage} />
      <ProtectedRoute path="/reports/profit-loss" component={ProfitLossPage} />
      <ProtectedRoute path="/reports/sales" component={SalesReportPage} />
      
      {/* User Settings */}
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
