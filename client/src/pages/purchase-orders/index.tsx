import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, getTransactionStatusColor, formatDate } from "@/lib/utils";
import { PageLayout } from "@/components/ui/page-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Plus, Download, Loader2 } from "lucide-react";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export default function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  
  // Fetch purchase orders
  const { 
    data: purchaseOrders, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/purchase-orders"],
  });
  
  // Delete purchase order mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/purchase-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: t('purchase.deleteSuccess'),
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update purchase order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest("PUT", `/api/purchase-orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
      toast({
        title: t('purchase.statusUpdated'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Table columns definition
  const columns = [
    {
      header: t('purchase.orderNumber'),
      accessorKey: 'orderNumber',
    },
    {
      header: t('purchase.date'),
      accessorKey: 'date',
      cell: ({ row }: any) => formatDate(row.date),
    },
    {
      header: t('purchase.vendor'),
      accessorKey: 'vendorId',
      cell: async ({ row }: any) => {
        try {
          const res = await fetch(`/api/vendors/${row.vendorId}`);
          if (!res.ok) return row.vendorId;
          const vendor = await res.json();
          return vendor.name;
        } catch (error) {
          return row.vendorId;
        }
      },
    },
    {
      header: t('purchase.totalAmount'),
      accessorKey: 'totalAmount',
      cell: ({ row }: any) => formatCurrency(row.totalAmount),
    },
    {
      header: t('purchase.status'),
      accessorKey: 'status',
      cell: ({ row }: any) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(row.status)}`}>
          {t(`purchase.${row.status}`)}
        </span>
      ),
    },
    {
      header: t('purchase.dueDate'),
      accessorKey: 'dueDate',
      cell: ({ row }: any) => row.dueDate ? formatDate(row.dueDate) : '-',
    },
    {
      header: t('common.actions'),
      accessorKey: 'id',
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end space-x-2">
          <PdfExportButton 
            url={`/api/export/purchase-order/${row.id}`} 
            filename={`purchase-order-${row.orderNumber}.pdf`}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {t('purchase.status')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'pending' })}>
                {t('purchase.pending')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'partial' })}>
                {t('purchase.partial')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'completed' })}>
                {t('purchase.completed')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'cancelled' })}>
                {t('purchase.cancelled')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  
  // Handle view purchase order
  const handleView = (order: any) => {
    navigate(`/purchase-orders/${order.id}`);
  };
  
  // Handle delete purchase order
  const handleDelete = (order: any) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete purchase order
  const confirmDelete = () => {
    if (orderToDelete) {
      deleteMutation.mutate(orderToDelete.id);
    }
  };
  
  // Check user permissions
  const canCreate = user && ["admin", "warehouse", "owner"].includes(user.role);
  const canDelete = user && ["admin", "owner"].includes(user.role);
  
  // Actions for the page header
  const actions = canCreate ? (
    <Link href="/purchase-orders/add">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        {t('purchase.addPurchase')}
      </Button>
    </Link>
  ) : null;
  
  if (error) {
    return (
      <PageLayout title="purchase.title" actions={actions}>
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="purchase.title" actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={purchaseOrders || []}
          onView={handleView}
          onDelete={canDelete ? handleDelete : undefined}
          searchable
          searchField="orderNumber"
          idField="id"
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('purchase.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
