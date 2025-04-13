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

export default function VendorsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);
  
  // Fetch vendors
  const { 
    data: vendors, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/vendors"],
  });
  
  // Delete vendor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: t('vendors.deleteSuccess'),
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
      header: t('vendors.code'),
      accessorKey: 'code',
    },
    {
      header: t('vendors.name'),
      accessorKey: 'name',
    },
    {
      header: t('vendors.phone'),
      accessorKey: 'phone',
    },
    {
      header: t('vendors.address'),
      accessorKey: 'address',
    },
  ];
  
  // Handle edit vendor
  const handleEdit = (vendor: any) => {
    navigate(`/vendors/edit/${vendor.id}`);
  };
  
  // Handle delete vendor
  const handleDelete = (vendor: any) => {
    setVendorToDelete(vendor);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete vendor
  const confirmDelete = () => {
    if (vendorToDelete) {
      deleteMutation.mutate(vendorToDelete.id);
    }
  };
  
  // Check user permissions
  const canEdit = user && ["admin", "warehouse", "owner"].includes(user.role);
  const canDelete = user && ["admin", "owner"].includes(user.role);
  
  // Actions for the page header
  const actions = (
    <Link href="/vendors/add">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        {t('vendors.addVendor')}
      </Button>
    </Link>
  );
  
  if (error) {
    return (
      <PageLayout title="vendors.title" actions={actions}>
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="vendors.title" actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={vendors || []}
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
              {t('vendors.deleteConfirm')}
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
