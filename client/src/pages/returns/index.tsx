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

export default function ReturnsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<any>(null);
  
  // Fetch product returns
  const { 
    data: returns, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/returns"],
  });
  
  // Delete product return mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/returns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      toast({
        title: t('returns.deleteSuccess'),
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
  
  // Update return status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await apiRequest("PUT", `/api/returns/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      toast({
        title: t('returns.statusUpdated'),
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
      header: t('returns.returnNumber'),
      accessorKey: 'returnNumber',
    },
    {
      header: t('returns.date'),
      accessorKey: 'date',
      cell: ({ row }: any) => formatDate(row.date),
    },
    {
      header: t('returns.customer'),
      accessorKey: 'customerId',
      cell: async ({ row }: any) => {
        try {
          const res = await fetch(`/api/customers/${row.customerId}`);
          if (!res.ok) return row.customerId;
          const customer = await res.json();
          return customer.name;
        } catch (error) {
          return row.customerId;
        }
      },
    },
    {
      header: t('returns.salesOrder'),
      accessorKey: 'salesOrderId',
      cell: ({ row }: any) => row.salesOrderId || '-',
    },
    {
      header: t('returns.totalAmount'),
      accessorKey: 'totalAmount',
      cell: ({ row }: any) => formatCurrency(row.totalAmount),
    },
    {
      header: t('returns.status'),
      accessorKey: 'status',
      cell: ({ row }: any) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionStatusColor(row.status)}`}>
          {t(`returns.${row.status}`)}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessorKey: 'id',
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end space-x-2">
          <PdfExportButton 
            url={`/api/export/return/${row.id}`} 
            filename={`return-${row.returnNumber}.pdf`}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {t('returns.status')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'pending' })}>
                {t('returns.pending')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'processing' })}>
                {t('returns.processing')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'completed' })}>
                {t('returns.completed')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: row.id, status: 'rejected' })}>
                {t('returns.rejected')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
  
  // Handle view return
  const handleView = (returnData: any) => {
    navigate(`/returns/${returnData.id}`);
  };
  
  // Handle delete return
  const handleDelete = (returnData: any) => {
    setReturnToDelete(returnData);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete return
  const confirmDelete = () => {
    if (returnToDelete) {
      deleteMutation.mutate(returnToDelete.id);
    }
  };
  
  // Check user permissions
  const canCreate = user && ["admin", "cashier", "warehouse", "owner"].includes(user.role);
  const canDelete = user && ["admin", "owner"].includes(user.role);
  
  // Actions for the page header
  const actions = canCreate ? (
    <Link href="/returns/add">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        {t('returns.addReturn')}
      </Button>
    </Link>
  ) : null;
  
  if (error) {
    return (
      <PageLayout title="returns.title" actions={actions}>
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="returns.title" actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={returns || []}
          onView={handleView}
          onDelete={canDelete ? handleDelete : undefined}
          searchable
          searchField="returnNumber"
          idField="id"
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('returns.deleteConfirm')}
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
