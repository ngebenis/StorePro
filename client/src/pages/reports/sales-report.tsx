import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2, CreditCard, TrendingUp } from "lucide-react";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

export default function SalesReportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Current date for default selections
  const currentYear = new Date().getFullYear().toString();
  
  // State for year filter
  const [year, setYear] = useState<string>(currentYear);
  
  // Fetch monthly sales data
  const { 
    data: monthlySales, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/reports/monthly-sales?year=${year}`],
  });
  
  // Generate array for year dropdown options
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);
  
  // Calculate sales summary
  const salesSummary = useMemo(() => {
    if (!monthlySales) return {
      totalSales: 0,
      avgMonthlySales: 0,
      highestMonth: { month: '', amount: 0 },
      lowestMonth: { month: '', amount: 0 }
    };
    
    const total = monthlySales.reduce((sum: number, month: any) => sum + month.amount, 0);
    const nonZeroMonths = monthlySales.filter((month: any) => month.amount > 0).length || 1;
    
    // Find highest and lowest months
    let highest = { month: '', amount: 0 };
    let lowest = { month: '', amount: Number.MAX_SAFE_INTEGER };
    
    monthlySales.forEach((month: any) => {
      if (month.amount > highest.amount) {
        highest = { month: month.month, amount: month.amount };
      }
      if (month.amount < lowest.amount && month.amount > 0) {
        lowest = { month: month.month, amount: month.amount };
      }
    });
    
    // If no sales, set lowest to 0
    if (lowest.amount === Number.MAX_SAFE_INTEGER) {
      lowest = { month: '', amount: 0 };
    }
    
    return {
      totalSales: total,
      avgMonthlySales: total / nonZeroMonths,
      highestMonth: highest,
      lowestMonth: lowest
    };
  }, [monthlySales]);
  
  // Prepare data for line chart
  const chartData = useMemo(() => {
    if (!monthlySales) return [];
    
    return monthlySales.map((month: any) => ({
      name: month.month,
      sales: month.amount,
      orders: month.orderCount
    }));
  }, [monthlySales]);
  
  // Check if user has appropriate role
  const hasAccess = user && ["admin", "owner"].includes(user.role);
  
  if (!hasAccess) {
    return (
      <PageLayout title="reports.sales.title">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg text-gray-600 mb-2">
                You do not have permission to view this report.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }
  
  if (error) {
    return (
      <PageLayout title="reports.sales.title">
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  // Actions for the page header
  const actions = (
    <PdfExportButton
      url={`/api/export/report/sales?year=${year}`}
      filename="sales-report.pdf"
    />
  );
  
  return (
    <PageLayout title="reports.sales.title" actions={actions}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.year')}</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('common.selectYear')} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                refetch();
              }}
            >
              {t('common.filter')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : monthlySales ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.sales.totalSales')}</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(salesSummary.totalSales)}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.sales.avgMonthlySales')}</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(salesSummary.avgMonthlySales)}</h3>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.sales.highestMonth')}</p>
                    <h3 className="text-2xl font-bold">{salesSummary.highestMonth.month}</h3>
                    <p className="text-sm text-gray-500">{formatCurrency(salesSummary.highestMonth.amount)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.sales.lowestMonth')}</p>
                    <h3 className="text-2xl font-bold">{salesSummary.lowestMonth.month}</h3>
                    <p className="text-sm text-gray-500">{formatCurrency(salesSummary.lowestMonth.amount)}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('reports.sales.monthlySales')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'sales') return formatCurrency(value as number);
                      return value;
                    }} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sales"
                      name={t('reports.sales.amount')}
                      stroke="#4f46e5"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name={t('reports.sales.orderCount')}
                      stroke="#94a3b8"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.sales.monthlySalesTable')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('common.month')}</TableHead>
                      <TableHead>{t('reports.sales.orderCount')}</TableHead>
                      <TableHead>{t('reports.sales.amount')}</TableHead>
                      <TableHead>{t('reports.sales.percentOfTotal')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlySales?.map((month: any) => (
                      <TableRow key={month.month}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell>{month.orderCount}</TableCell>
                        <TableCell>{formatCurrency(month.amount)}</TableCell>
                        <TableCell>
                          {salesSummary.totalSales > 0
                            ? ((month.amount / salesSummary.totalSales) * 100).toFixed(1) + '%'
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg text-gray-600 mb-2">
                {t('reports.sales.noData')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}