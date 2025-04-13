import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductSchema, InsertProduct } from "@shared/schema";
import { PageLayout } from "@/components/ui/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ArrowLeft, Save, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Extend the product schema for the form
const productFormSchema = insertProductSchema.extend({
  categoryId: z.coerce.number().min(1, "Category is required"),
  costPrice: z.coerce.number().positive("Cost price must be positive"),
  sellPrice: z.coerce.number().positive("Sell price must be positive"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
});

export default function AddProductPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const params = useParams();
  const { id } = params;
  const isEditMode = !!id;
  
  // State for category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  // Product form
  const form = useForm<InsertProduct>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: "",
      name: "",
      categoryId: 0,
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
    },
  });
  
  // Fetch categories
  const { 
    data: categories, 
    isLoading: categoriesLoading, 
    error: categoriesError 
  } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Fetch product details for edit mode
  const { 
    data: product, 
    isLoading: productLoading, 
    error: productError 
  } = useQuery({
    queryKey: [`/api/products/${id}`],
    enabled: isEditMode,
  });
  
  // Set form values when product data is available in edit mode
  useEffect(() => {
    if (isEditMode && product) {
      form.reset({
        code: product.code,
        name: product.name,
        categoryId: product.categoryId,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        stock: product.stock,
      });
    }
  }, [isEditMode, product, form]);
  
  // Create/update product mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      if (isEditMode) {
        await apiRequest("PUT", `/api/products/${id}`, data);
      } else {
        await apiRequest("POST", "/api/products", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: t('products.productSaved'),
      });
      navigate("/products");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Category form
  const categoryForm = useForm<{ name: string; description: string }>({
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  // Create category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return await response.json();
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: t('common.success'),
        description: "Category added successfully",
      });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      
      // Set the newly created category in the product form
      form.setValue("categoryId", newCategory.id);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit handler for product form
  const onSubmit = (data: InsertProduct) => {
    mutation.mutate(data);
  };
  
  // Submit handler for category form
  const onSubmitCategory = (data: { name: string; description: string }) => {
    categoryMutation.mutate(data);
  };
  
  // Check for errors
  const hasError = categoriesError || (isEditMode && productError);
  if (hasError) {
    return (
      <PageLayout title={isEditMode ? 'products.editProduct' : 'products.addProduct'}>
        <ErrorAlert message={(categoriesError || productError)?.message || "Failed to load data"} />
      </PageLayout>
    );
  }
  
  // Loading state
  const isLoading = categoriesLoading || (isEditMode && productLoading);
  
  // Actions for the page header
  const actions = (
    <Button variant="outline" onClick={() => navigate("/products")}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t('common.back')}
    </Button>
  );
  
  return (
    <PageLayout title={isEditMode ? 'products.editProduct' : 'products.addProduct'} actions={actions}>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.code')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('products.code')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('products.name')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.category')}</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value.toString()}
                              defaultValue={field.value.toString()}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('products.selectCategory')} />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          
                          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('products.addCategory')}</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <FormLabel>{t('products.categoryName')}</FormLabel>
                                    <Input
                                      {...categoryForm.register("name", { required: true })}
                                      placeholder={t('products.categoryName')}
                                    />
                                    {categoryForm.formState.errors.name && (
                                      <p className="text-sm text-red-500">
                                        {categoryForm.formState.errors.name.message}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <FormLabel>{t('products.categoryDescription')}</FormLabel>
                                    <Input
                                      {...categoryForm.register("description")}
                                      placeholder={t('products.categoryDescription')}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCategoryDialogOpen(false)}
                                  >
                                    {t('common.cancel')}
                                  </Button>
                                  <Button
                                    type="submit"
                                    disabled={categoryMutation.isPending}
                                  >
                                    {categoryMutation.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t('common.save')}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.costPrice')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('products.costPrice')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sellPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.sellPrice')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('products.sellPrice')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('products.stock')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('products.stock')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/products")}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-2 h-4 w-4" />
                    {t('common.save')}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
