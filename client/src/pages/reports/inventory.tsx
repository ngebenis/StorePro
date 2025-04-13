import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2, BarChart2 } from "lucide-react";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getStockStatusColor } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

export default function InventoryReportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State for filters
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  
  // Fetch inventory data
  const { 
    data: inventory, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/reports/inventory"],
  });
  
  // Fetch categories for filter dropdown
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Apply filters to inventory data
  const filteredInventory = inventory?.filter((item: any) => {
    // Apply category filter
    if (categoryFilter && item.categoryId.toString() !== categoryFilter) {
      return false;
    }
    
    // Apply search term filter
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Apply stock filter
    if (stockFilter === "low" && item.stock > 5) {
      return false;
    }
    if (stockFilter === "out" && item.stock > 0) {
      return false;
    }
    if (stockFilter === "available" && item.stock === 0) {
      return false;
    }
    
    return true;
  });
  
  // Calculate inventory summary
  const inventorySummary = {
    totalItems: filteredInventory?.length || 0,
    totalValue: filteredInventory?.reduce((sum: number, item: any) => sum + (item.stock * item.costPrice), 0) || 0,
    outOfStock: filteredInventory?.filter((item: any) => item.stock === 0).length || 0,
    lowStock: filteredInventory?.filter((item: any) => item.stock > 0 && item.stock <= 5).length || 0,
  };
  
  // Check if user has appropriate role
  const hasAccess = user && ["admin", "warehouse", "owner"].includes(user.role);
  
  if (!hasAccess) {
    return (
      <PageLayout title="reports.inventory.title">
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
      <PageLayout title="reports.inventory.title">
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  // Actions for the page header
  const actions = (
    <PdfExportButton
      url="/api/export/report/inventory"
      filename="inventory-report.pdf"
    />
  );
  
  return (
    <PageLayout title="reports.inventory.title" actions={actions}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('common.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">{t('products.search')}</label>
              <Input
                placeholder={t('products.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">{t('products.category')}</label>
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.all')}</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1 min-w-[200px]">
              <label className="text-sm font-medium">{t('products.stockStatus')}</label>
              <Select
                value={stockFilter}
                onValueChange={setStockFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="low">{t('products.lowStock')}</SelectItem>
                  <SelectItem value="out">{t('products.outOfStock')}</SelectItem>
                  <SelectItem value="available">{t('products.available')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{t('reports.inventory.totalItems')}</p>
                <h3 className="text-2xl font-bold">{inventorySummary.totalItems}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{t('reports.inventory.totalValue')}</p>
                <h3 className="text-2xl font-bold">{formatCurrency(inventorySummary.totalValue)}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{t('reports.inventory.outOfStock')}</p>
                <h3 className="text-2xl font-bold">{inventorySummary.outOfStock}</h3>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <BarChart2 className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">{t('reports.inventory.lowStock')}</p>
                <h3 className="text-2xl font-bold">{inventorySummary.lowStock}</h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <BarChart2 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.inventory.inventoryList')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredInventory?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg text-gray-600 mb-2">
                {t('reports.inventory.noData')}
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('products.code')}</TableHead>
                    <TableHead>{t('products.name')}</TableHead>
                    <TableHead>{t('products.category')}</TableHead>
                    <TableHead>{t('products.costPrice')}</TableHead>
                    <TableHead>{t('products.sellingPrice')}</TableHead>
                    <TableHead>{t('products.stock')}</TableHead>
                    <TableHead>{t('reports.inventory.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusColor(item.stock)}`}>
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell>{formatCurrency(item.stock * item.costPrice)}</TableCell>
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