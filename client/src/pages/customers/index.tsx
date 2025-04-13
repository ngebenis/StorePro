import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageLayout } from "@/components/ui/page-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Plus, Loader2 } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";

export default function CustomersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);
  
  // Fetch customers
  const { 
    data: customers, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: t('customers.deleteSuccess'),
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
  
  // Table columns definition
  const columns = [
    {
      header: t('customers.code'),
      accessorKey: 'code',
    },
    {
      header: t('customers.name'),
      accessorKey: 'name',
    },
    {
      header: t('customers.phone'),
      accessorKey: 'phone',
    },
    {
      header: t('customers.address'),
      accessorKey: 'address',
    },
  ];
  
  // Handle edit customer
  const handleEdit = (customer: any) => {
    navigate(`/customers/edit/${customer.id}`);
  };
  
  // Handle delete customer
  const handleDelete = (customer: any) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete customer
  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };
  
  // Check user permissions
  const canEdit = user && ["admin", "cashier", "owner"].includes(user.role);
  const canDelete = user && ["admin", "owner"].includes(user.role);
  
  // Actions for the page header
  const actions = (
    <Link href="/customers/add">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        {t('customers.addCustomer')}
      </Button>
    </Link>
  );
  
  if (error) {
    return (
      <PageLayout title="customers.title" actions={actions}>
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="customers.title" actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers || []}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          searchable
          searchField="name"
          idField="id"
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('customers.deleteConfirm')}
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
