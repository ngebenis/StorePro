import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useAuth } from "@/hooks/use-auth";

export default function ProfitLossPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Current date for default selections
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString();
  const currentYear = currentDate.getFullYear().toString();
  
  // State for date filters
  const [month, setMonth] = useState<string>(currentMonth);
  const [year, setYear] = useState<string>(currentYear);
  
  // Fetch profit loss data
  const { 
    data: profitLoss, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/reports/profit-loss?month=${month}&year=${year}`],
  });
  
  // Generate arrays for month and year dropdown options
  const months = useMemo(() => [
    { value: "1", label: t('months.january') },
    { value: "2", label: t('months.february') },
    { value: "3", label: t('months.march') },
    { value: "4", label: t('months.april') },
    { value: "5", label: t('months.may') },
    { value: "6", label: t('months.june') },
    { value: "7", label: t('months.july') },
    { value: "8", label: t('months.august') },
    { value: "9", label: t('months.september') },
    { value: "10", label: t('months.october') },
    { value: "11", label: t('months.november') },
    { value: "12", label: t('months.december') }
  ], [t]);
  
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);
  
  // Prepare data for bar chart
  const chartData = useMemo(() => {
    if (!profitLoss) return [];
    
    return [
      {
        name: t('reports.profitLoss.revenue'),
        value: profitLoss.revenue,
        color: "#4ade80",
      },
      {
        name: t('reports.profitLoss.cogs'),
        value: profitLoss.costOfGoodsSold,
        color: "#f87171",
      },
      {
        name: t('reports.profitLoss.grossProfit'),
        value: profitLoss.grossProfit,
        color: "#60a5fa",
      },
      {
        name: t('reports.profitLoss.expenses'),
        value: profitLoss.expenses,
        color: "#fbbf24",
      },
      {
        name: t('reports.profitLoss.netProfit'),
        value: profitLoss.netProfit,
        color: "#818cf8",
      },
    ];
  }, [profitLoss, t]);
  
  // Check if user has appropriate role
  const hasAccess = user && ["admin", "owner"].includes(user.role);
  
  if (!hasAccess) {
    return (
      <PageLayout title="reports.profitLoss.title">
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
      <PageLayout title="reports.profitLoss.title">
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  // Actions for the page header
  const actions = (
    <PdfExportButton
      url={`/api/export/report/profit-loss?month=${month}&year=${year}`}
      filename="profit-loss-report.pdf"
    />
  );
  
  return (
    <PageLayout title="reports.profitLoss.title" actions={actions}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.month')}</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('common.selectMonth')} />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
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
      ) : profitLoss ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.profitLoss.revenue')}</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(profitLoss.revenue)}</h3>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.profitLoss.expenses')}</p>
                    <h3 className="text-2xl font-bold">{formatCurrency(profitLoss.expenses)}</h3>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">{t('reports.profitLoss.netProfit')}</p>
                    <h3 className={`text-2xl font-bold ${profitLoss.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(profitLoss.netProfit)}
                    </h3>
                  </div>
                  <div className={`p-2 rounded-full ${profitLoss.netProfit < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                    {profitLoss.netProfit < 0 ? (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    ) : (
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.profitLoss.summary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
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
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.profitLoss.details')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{t('reports.profitLoss.revenue')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(profitLoss.revenue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{t('reports.profitLoss.cogs')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(profitLoss.costOfGoodsSold)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-medium">{t('reports.profitLoss.grossProfit')}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(profitLoss.grossProfit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium pt-4">
                        {t('reports.profitLoss.expensesBreakdown')}
                      </TableCell>
                    </TableRow>
                    {profitLoss.expensesBreakdown?.map((expense: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="pl-6">{expense.category}</TableCell>
                        <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="font-medium">{t('reports.profitLoss.totalExpenses')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(profitLoss.expenses)}</TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-medium">{t('reports.profitLoss.netProfit')}</TableCell>
                      <TableCell className={`text-right font-bold ${profitLoss.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(profitLoss.netProfit)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{t('reports.profitLoss.profitMargin')}</TableCell>
                      <TableCell className={`text-right font-medium ${profitLoss.profitMargin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {(profitLoss.profitMargin * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg text-gray-600 mb-2">
                {t('reports.profitLoss.noData')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}