import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatCurrency, getTransactionStatusColor, getTransactionTypeColor } from "@/lib/utils";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorAlert } from "@/components/ui/error-alert";
import { 
  ShoppingCart, 
  FileText, 
  HandCoins, 
  TrendingUp,
  Boxes,
  Users,
  Building,
  ArrowUp, 
  ArrowDown,
  BarChart3
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const { t } = useTranslation();
  
  // Fetch dashboard statistics
  const { 
    data: stats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  // Fetch recent transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions"],
  });
  
  // Fetch low stock products
  const { 
    data: lowStockProducts, 
    isLoading: productsLoading, 
    error: productsError 
  } = useQuery({
    queryKey: ["/api/products/low-stock/5"],
  });
  
  // Check if any data fetch has failed
  const hasError = statsError || transactionsError || productsError;
  if (hasError) {
    return (
      <PageLayout title="dashboard.title">
        <ErrorAlert message={(statsError || transactionsError || productsError)?.message || "Failed to load dashboard data"} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="dashboard.title">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Monthly Sales */}
        <StatCard 
          title={t('dashboard.monthlySales')}
          value={statsLoading ? null : formatCurrency(stats?.totalMonthlySales || 0)}
          icon={<ShoppingCart className="text-primary" />}
          change={statsLoading ? null : stats?.salesChange}
          isLoading={statsLoading}
        />
        
        {/* Accounts Payable */}
        <StatCard 
          title={t('dashboard.accountsPayable')}
          value={statsLoading ? null : formatCurrency(stats?.totalPayables || 0)}
          icon={<FileText className="text-red-500" />}
          change={5}
          direction="up"
          changeColor="text-red-600"
          isLoading={statsLoading}
        />
        
        {/* Accounts Receivable */}
        <StatCard 
          title={t('dashboard.accountsReceivable')}
          value={statsLoading ? null : formatCurrency(stats?.totalReceivables || 0)}
          icon={<HandCoins className="text-yellow-500" />}
          change={-3}
          direction="down"
          changeColor="text-yellow-600"
          isLoading={statsLoading}
        />
        
        {/* Profit/Loss */}
        <StatCard 
          title={t('dashboard.monthlyProfit')}
          value={statsLoading ? null : formatCurrency(stats?.monthlyProfit || 0)}
          icon={<TrendingUp className="text-green-500" />}
          change={8}
          isLoading={statsLoading}
        />
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Inventory */}
        <StatCard 
          title={t('dashboard.inventoryValue')}
          value={statsLoading ? null : formatCurrency(stats?.totalInventoryValue || 0)}
          icon={<Boxes className="text-purple-500" />}
          subtitle={statsLoading ? "" : `${stats?.totalInventoryItems} ${t('dashboard.productsInStock')}`}
          isLoading={statsLoading}
          bgColor="bg-purple-50"
        />
        
        {/* Customer Count */}
        <StatCard 
          title={t('dashboard.totalCustomers')}
          value={statsLoading ? null : stats?.customerCount.toString()}
          icon={<Users className="text-blue-500" />}
          subtitle={`12 ${t('dashboard.newThisMonth')}`}
          isLoading={statsLoading}
          bgColor="bg-blue-50"
        />
        
        {/* Vendor Count */}
        <StatCard 
          title={t('dashboard.totalVendors')}
          value={statsLoading ? null : stats?.vendorCount.toString()}
          icon={<Building className="text-gray-500" />}
          subtitle={`3 ${t('dashboard.newThisMonth')}`}
          isLoading={statsLoading}
          bgColor="bg-gray-100"
        />
      </div>
      
      {/* Recent Transactions & Low Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Transactions */}
        <div className="mb-6 lg:mb-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('dashboard.recentTransactions')}</h2>
            <Link href="/sales-orders">
              <Button variant="link" className="text-primary">
                {t('dashboard.viewAll')}
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t('transactions.transactionId')}</TableHead>
                    <TableHead className="font-semibold">{t('transactions.date')}</TableHead>
                    <TableHead className="font-semibold">{t('transactions.customerVendor')}</TableHead>
                    <TableHead className="font-semibold">{t('transactions.type')}</TableHead>
                    <TableHead className="font-semibold">{t('transactions.amount')}</TableHead>
                    <TableHead className="font-semibold">{t('transactions.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsLoading ? (
                    Array(4).fill(0).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium text-primary hover:text-primary-dark hover:underline">
                          <Link href={`/${transaction.type === 'sale' ? 'sales-orders' : transaction.type === 'purchase' ? 'purchase-orders' : 'returns'}/${transaction.id}`}>
                            {transaction.transactionId}
                          </Link>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(transaction.date).toISOString().split('T')[0]}
                        </TableCell>
                        <TableCell className="text-gray-800">
                          {transaction.entityName}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                            {t(`transactions.${transaction.type}`)}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-800">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(transaction.status)}`}>
                            {t(`transactions.${transaction.status}`)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        {/* Low Stock Products */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('dashboard.lowStockProducts')}</h2>
            <Link href="/products">
              <Button variant="link" className="text-primary">
                {t('dashboard.viewAll')}
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">{t('products.name')}</TableHead>
                    <TableHead className="font-semibold">{t('products.code')}</TableHead>
                    <TableHead className="font-semibold">{t('products.category')}</TableHead>
                    <TableHead className="font-semibold">{t('products.stock')}</TableHead>
                    <TableHead className="font-semibold">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    Array(4).fill(0).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : lowStockProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No low stock products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts?.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-gray-800">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {product.code}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {product.categoryName}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.stock <= 3 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href="/purchase-orders/add">
                            <Button size="sm" variant="primary" className="px-3 py-1 bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600">
                              {t('dashboard.order')}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Monthly Sales Chart */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{t('dashboard.monthlySales')}</h2>
          <div className="flex items-center space-x-2">
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option value="2023">2023</option>
            </select>
            <Link href="/reports/sales">
              <Button variant="link" className="text-primary">
                {t('dashboard.details')}
              </Button>
            </Link>
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6 pb-2">
            <div className="h-80 w-full flex items-center justify-center">
              {statsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <MonthlyChart />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | null;
  icon: React.ReactNode;
  change?: number | null;
  direction?: "up" | "down";
  changeColor?: string;
  subtitle?: string;
  isLoading?: boolean;
  bgColor?: string;
}

function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  direction = "up", 
  changeColor = "text-green-600", 
  subtitle,
  isLoading = false,
  bgColor = "bg-blue-50"
}: StatCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mt-1" />
            ) : (
              <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
            )}
            {(change !== null && change !== undefined) && (
              <p className={`text-xs ${changeColor} flex items-center mt-1`}>
                {direction === "up" ? (
                  <ArrowUp size={12} className="mr-1" />
                ) : (
                  <ArrowDown size={12} className="mr-1" />
                )}
                <span>{change}% {t('dashboard.fromLastMonth')}</span>
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-gray-600 flex items-center mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 ${bgColor} rounded-full`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simplified Monthly Chart Component
function MonthlyChart() {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  // Sample data (in a real app, this would come from the API)
  const data = [
    { month: "Jan", value: 30 },
    { month: "Feb", value: 45 },
    { month: "Mar", value: 65 },
    { month: "Apr", value: 55 },
    { month: "May", value: 70 },
    { month: "Jun", value: 60 },
    { month: "Jul", value: 75 },
    { month: "Aug", value: 80 },
    { month: "Sep", value: 85 },
    { month: "Oct", value: 90 },
    { month: "Nov", value: 25 },
    { month: "Dec", value: 25 },
  ];
  
  return (
    <div className="w-full h-full flex items-end justify-between px-2">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div 
            className={`w-12 ${index === 9 ? 'bg-primary' : index > 9 ? 'bg-gray-300' : 'bg-blue-500'} rounded-t`} 
            style={{ height: `${item.value}%` }}
          ></div>
          <span className="text-xs mt-1">{item.month}</span>
        </div>
      ))}
    </div>
  );
}
