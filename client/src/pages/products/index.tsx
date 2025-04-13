import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, getStockStatusColor } from "@/lib/utils";
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

export default function ProductsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  
  // Fetch products
  const { 
    data: products, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: t('products.deleteSuccess'),
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
      header: t('products.code'),
      accessorKey: 'code',
    },
    {
      header: t('products.name'),
      accessorKey: 'name',
    },
    {
      header: t('products.category'),
      accessorKey: 'categoryName',
    },
    {
      header: t('products.costPrice'),
      accessorKey: 'costPrice',
      cell: ({ row }: any) => formatCurrency(row.costPrice),
    },
    {
      header: t('products.sellPrice'),
      accessorKey: 'sellPrice',
      cell: ({ row }: any) => formatCurrency(row.sellPrice),
    },
    {
      header: t('products.stock'),
      accessorKey: 'stock',
      cell: ({ row }: any) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStockStatusColor(row.stock)}`}>
          {row.stock}
        </span>
      ),
    },
    {
      header: t('products.lastUpdated'),
      accessorKey: 'lastUpdated',
      cell: ({ row }: any) => new Date(row.lastUpdated).toLocaleDateString(),
    },
  ];
  
  // Handle edit product
  const handleEdit = (product: any) => {
    navigate(`/products/edit/${product.id}`);
  };
  
  // Handle delete product
  const handleDelete = (product: any) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm delete product
  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.id);
    }
  };
  
  // Check user permissions
  const canEdit = user && ["admin", "warehouse", "owner"].includes(user.role);
  const canDelete = user && ["admin", "owner"].includes(user.role);
  
  // Actions for the page header
  const actions = (
    <Link href="/products/add">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        {t('products.addProduct')}
      </Button>
    </Link>
  );
  
  if (error) {
    return (
      <PageLayout title="products.title" actions={actions}>
        <ErrorAlert message={error.message} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="products.title" actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products || []}
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
              {t('products.deleteConfirm')}
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
