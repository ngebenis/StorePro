import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  Package,
  Users,
  Building,
  ShoppingCart,
  CreditCard,
  RotateCcw,
  FileText,
  DollarSign,
  HandCoins,
  Boxes,
  TrendingUp,
  BarChart
} from "lucide-react";

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  roles?: string[];
};

const SidebarLink = ({ href, icon, children, roles = [] }: SidebarLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(`${href}/`);
  const { user } = useAuth();

  // Check if user has permission to see this link
  const hasPermission = roles.length === 0 || (user && roles.includes(user.role));

  if (!hasPermission) return null;

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700",
          isActive && "bg-gray-700"
        )}
      >
        <span className="w-6">{icon}</span>
        <span className="ml-2">{children}</span>
      </a>
    </Link>
  );
};

type SidebarSectionProps = {
  title: string;
  children: React.ReactNode;
};

const SidebarSection = ({ title, children }: SidebarSectionProps) => {
  const { t } = useTranslation();
  
  return (
    <>
      <div className="px-4 py-2 mt-4">
        <p className="text-xs uppercase tracking-wider text-gray-400">{t(title)}</p>
      </div>
      {children}
    </>
  );
};

export default function Sidebar() {
  const { t } = useTranslation();
  
  return (
    <aside className="bg-gray-800 text-white w-64 flex-shrink-0 hidden md:block h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <svg className="h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <h1 className="text-xl font-bold">SimpleStore</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">{t('navigation.dashboard')}</p>
      </div>
      
      <nav className="mt-4">
        <SidebarSection title="navigation.mainNavigation">
          <SidebarLink href="/" icon={<LayoutDashboard size={18} />}>
            {t('navigation.dashboard')}
          </SidebarLink>
        </SidebarSection>
        
        <SidebarSection title="navigation.masterData">
          <SidebarLink 
            href="/products" 
            icon={<Package size={18} />} 
            roles={["admin", "warehouse", "owner"]}
          >
            {t('navigation.products')}
          </SidebarLink>
          
          <SidebarLink 
            href="/customers" 
            icon={<Users size={18} />} 
            roles={["admin", "cashier", "owner"]}
          >
            {t('navigation.customers')}
          </SidebarLink>
          
          <SidebarLink 
            href="/vendors" 
            icon={<Building size={18} />} 
            roles={["admin", "warehouse", "owner"]}
          >
            {t('navigation.vendors')}
          </SidebarLink>
        </SidebarSection>
        
        <SidebarSection title="navigation.transactions">
          <SidebarLink 
            href="/purchase-orders" 
            icon={<ShoppingCart size={18} />} 
            roles={["admin", "warehouse", "owner"]}
          >
            {t('navigation.purchaseOrders')}
          </SidebarLink>
          
          <SidebarLink 
            href="/sales-orders" 
            icon={<CreditCard size={18} />} 
            roles={["admin", "cashier", "owner"]}
          >
            {t('navigation.salesOrders')}
          </SidebarLink>
          
          <SidebarLink 
            href="/returns" 
            icon={<RotateCcw size={18} />} 
            roles={["admin", "cashier", "warehouse", "owner"]}
          >
            {t('navigation.returns')}
          </SidebarLink>
        </SidebarSection>
        
        <SidebarSection title="navigation.reports">
          <SidebarLink 
            href="/reports/accounts-payable" 
            icon={<FileText size={18} />} 
            roles={["admin", "owner"]}
          >
            {t('navigation.accountsPayable')}
          </SidebarLink>
          
          <SidebarLink 
            href="/reports/accounts-receivable" 
            icon={<DollarSign size={18} />} 
            roles={["admin", "cashier", "owner"]}
          >
            {t('navigation.accountsReceivable')}
          </SidebarLink>
          
          <SidebarLink 
            href="/reports/inventory" 
            icon={<Boxes size={18} />} 
            roles={["admin", "warehouse", "owner"]}
          >
            {t('navigation.inventory')}
          </SidebarLink>
          
          <SidebarLink 
            href="/reports/profit-loss" 
            icon={<TrendingUp size={18} />} 
            roles={["admin", "owner"]}
          >
            {t('navigation.profitLoss')}
          </SidebarLink>
          
          <SidebarLink 
            href="/reports/sales" 
            icon={<BarChart size={18} />} 
            roles={["admin", "cashier", "owner"]}
          >
            {t('navigation.salesReport')}
          </SidebarLink>
        </SidebarSection>
      </nav>
    </aside>
  );
}
