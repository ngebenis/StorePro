import { Switch, Route } from "wouter";
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
      <Route path="/auth">
        <AuthPage />
      </Route>
      
      {/* Dashboard */}
      <Route path="/" exact>
        <ProtectedRoute path="/" component={Dashboard} />
      </Route>
      
      {/* Master Data Management */}
      <Route path="/products" exact>
        <ProtectedRoute path="/products" component={ProductsPage} />
      </Route>
      <Route path="/products/add">
        <ProtectedRoute path="/products/add" component={AddProductPage} />
      </Route>
      <Route path="/products/edit/:id">
        <ProtectedRoute path="/products/edit/:id" component={AddProductPage} />
      </Route>
      
      <Route path="/customers" exact>
        <ProtectedRoute path="/customers" component={CustomersPage} />
      </Route>
      <Route path="/customers/add">
        <ProtectedRoute path="/customers/add" component={AddCustomerPage} />
      </Route>
      <Route path="/customers/edit/:id">
        <ProtectedRoute path="/customers/edit/:id" component={AddCustomerPage} />
      </Route>
      
      <Route path="/vendors" exact>
        <ProtectedRoute path="/vendors" component={VendorsPage} />
      </Route>
      <Route path="/vendors/add">
        <ProtectedRoute path="/vendors/add" component={AddVendorPage} />
      </Route>
      <Route path="/vendors/edit/:id">
        <ProtectedRoute path="/vendors/edit/:id" component={AddVendorPage} />
      </Route>
      
      {/* Transactions */}
      <Route path="/purchase-orders" exact>
        <ProtectedRoute path="/purchase-orders" component={PurchaseOrdersPage} />
      </Route>
      <Route path="/purchase-orders/add">
        <ProtectedRoute path="/purchase-orders/add" component={AddPurchasePage} />
      </Route>
      <Route path="/purchase-orders/:id">
        <ProtectedRoute path="/purchase-orders/:id" component={AddPurchasePage} />
      </Route>
      
      <Route path="/sales-orders" exact>
        <ProtectedRoute path="/sales-orders" component={SalesOrdersPage} />
      </Route>
      <Route path="/sales-orders/add">
        <ProtectedRoute path="/sales-orders/add" component={AddSalePage} />
      </Route>
      <Route path="/sales-orders/:id">
        <ProtectedRoute path="/sales-orders/:id" component={AddSalePage} />
      </Route>
      
      <Route path="/returns" exact>
        <ProtectedRoute path="/returns" component={ReturnsPage} />
      </Route>
      <Route path="/returns/add">
        <ProtectedRoute path="/returns/add" component={AddReturnPage} />
      </Route>
      <Route path="/returns/:id">
        <ProtectedRoute path="/returns/:id" component={AddReturnPage} />
      </Route>
      
      {/* Reports */}
      <Route path="/reports/accounts-payable">
        <ProtectedRoute path="/reports/accounts-payable" component={AccountsPayablePage} />
      </Route>
      <Route path="/reports/accounts-receivable">
        <ProtectedRoute path="/reports/accounts-receivable" component={AccountsReceivablePage} />
      </Route>
      <Route path="/reports/inventory">
        <ProtectedRoute path="/reports/inventory" component={InventoryReportPage} />
      </Route>
      <Route path="/reports/profit-loss">
        <ProtectedRoute path="/reports/profit-loss" component={ProfitLossPage} />
      </Route>
      <Route path="/reports/sales">
        <ProtectedRoute path="/reports/sales" component={SalesReportPage} />
      </Route>
      
      {/* User Settings */}
      <Route path="/settings">
        <ProtectedRoute path="/settings" component={SettingsPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute path="/profile" component={ProfilePage} />
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen">
      <Router />
      <Toaster />
    </div>
  );
}

export default App;
