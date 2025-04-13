import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2, FileDown } from "lucide-react";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, getTransactionStatusColor } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/hooks/use-auth";

export default function AccountsPayablePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for date filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Build query string for date filters
  const getQueryString = () => {
    let queryString = '';
    if (startDate) {
      queryString += `startDate=${startDate.toISOString().split('T')[0]}&`;
    }
    if (endDate) {
      queryString += `endDate=${endDate.toISOString().split('T')[0]}`;
    }
    return queryString ? `?${queryString}` : '';
  };
  
  // Fetch accounts payable data
  const { 
    data: payables, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/reports/accounts-payable${getQueryString()}`],
  });
  
  // Calculate total remaining amount
  const totalRemaining = payables?.reduce((sum: number, item: any) => sum + item.remainingAmount, 0) || 0;
  
  // Check if user has appropriate role
  const hasAccess = user && ["admin", "owner"].includes(user.role);
  
  if (!hasAccess) {
    return (
      <PageLayout title="reports.accountsPayable.title">
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
      <PageLayout title="reports.accountsPayable.title">
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  // Actions for the page header
  const actions = (
    <PdfExportButton
      url="/api/export/report/accounts-payable"
      filename="accounts-payable-report.pdf"
    />
  );
  
  return (
    <PageLayout title="reports.accountsPayable.title" actions={actions}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.from')}</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                placeholder={t('common.selectDate')}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.to')}</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                placeholder={t('common.selectDate')}
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                refetch();
              }}
            >
              {t('common.filter')}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
                setTimeout(() => refetch(), 0);
              }}
            >
              {t('common.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('reports.accountsPayable.title')}</CardTitle>
          <div className="text-lg font-bold">
            {t('reports.accountsPayable.totalAmount')}: {formatCurrency(totalRemaining)}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payables?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg text-gray-600 mb-2">
                {t('reports.accountsPayable.noData')}
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.accountsPayable.orderNumber')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.date')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.vendor')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.totalAmount')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.dueDate')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.status')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.remainingAmount')}</TableHead>
                    <TableHead>{t('reports.accountsPayable.ageDays')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.orderNumber}</TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{item.vendorName}</TableCell>
                      <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                      <TableCell>{item.dueDate ? formatDate(item.dueDate) : '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(item.status)}`}>
                          {t(`purchase.${item.status}`)}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(item.remainingAmount)}</TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.ageDays > 30 ? 'bg-red-100 text-red-800' : item.ageDays > 15 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item.ageDays}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
