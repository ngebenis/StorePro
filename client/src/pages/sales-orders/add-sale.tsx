import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertSalesOrderSchema, insertSalesOrderItemSchema } from "@shared/schema";
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
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { PdfExportButton } from "@/components/ui/pdf-export-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Form schemas
const salesItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  total: z.coerce.number(),
});

const salesFormSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(salesItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number(),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

export default function AddSalePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const params = useParams();
  const { id } = params;
  const isViewMode = !!id;
  
  // Form setup
  const form = useForm<SalesFormValues>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      customerId: 0,
      date: new Date(),
      notes: "",
      items: [
        {
          productId: 0,
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
      totalAmount: 0,
    },
  });
  
  // Items field array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Watch form values for calculations
  const watchItems = form.watch("items");
  
  // Fetch customers
  const { 
    data: customers, 
    isLoading: customersLoading, 
    error: customersError 
  } = useQuery({
    queryKey: ["/api/customers"],
  });
  
  // Fetch products
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError 
  } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Fetch sales order details if in view mode
  const { 
    data: salesOrder, 
    isLoading: salesOrderLoading, 
    error: salesOrderError 
  } = useQuery({
    queryKey: [`/api/sales-orders/${id}`],
    enabled: isViewMode,
  });
  
  // Calculate totals when items change
  useEffect(() => {
    if (watchItems) {
      // Update each item's total
      watchItems.forEach((item, index) => {
        if (item.quantity && item.price) {
          const total = item.quantity * item.price;
          form.setValue(`items.${index}.total`, total);
        }
      });
      
      // Update the total amount
      const totalAmount = watchItems.reduce((sum, item) => sum + (item.total || 0), 0);
      form.setValue("totalAmount", totalAmount);
    }
  }, [watchItems, form]);
  
  // Set form values when sales order data is available in view mode
  useEffect(() => {
    if (isViewMode && salesOrder) {
      form.reset({
        customerId: salesOrder.customerId,
        date: new Date(salesOrder.date),
        dueDate: salesOrder.dueDate ? new Date(salesOrder.dueDate) : undefined,
        notes: salesOrder.notes || "",
        items: salesOrder.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        totalAmount: salesOrder.totalAmount,
      });
    }
  }, [isViewMode, salesOrder, form]);
  
  // Create sales order mutation
  const mutation = useMutation({
    mutationFn: async (data: SalesFormValues) => {
      const salesOrderData = {
        customerId: data.customerId,
        date: data.date.toISOString().split('T')[0],
        dueDate: data.dueDate ? data.dueDate.toISOString().split('T')[0] : undefined,
        totalAmount: data.totalAmount,
        notes: data.notes,
        paymentStatus: "unpaid",
      };
      
      const itemsData = data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));
      
      await apiRequest("POST", "/api/sales-orders", {
        salesOrder: salesOrderData,
        items: itemsData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-orders"] });
      toast({
        title: t('sales.saleSaved'),
      });
      navigate("/sales-orders");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: SalesFormValues) => {
    mutation.mutate(data);
  };
  
  // Handle adding a new item
  const addItem = () => {
    append({
      productId: 0,
      quantity: 1,
      price: 0,
      total: 0,
    });
  };
  
  // Handle setting the default price when a product is selected
  const handleProductChange = (productId: number, index: number) => {
    const product = products?.find((p: any) => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.price`, product.sellPrice);
      // Recalculate total
      const quantity = form.getValues(`items.${index}.quantity`);
      form.setValue(`items.${index}.total`, quantity * product.sellPrice);
    }
  };
  
  // Check for errors
  const hasError = customersError || productsError || (isViewMode && salesOrderError);
  if (hasError) {
    return (
      <PageLayout title={isViewMode ? 'sales.saleDetails' : 'sales.addSale'}>
        <ErrorAlert message={(customersError || productsError || salesOrderError)?.message || "Failed to load data"} />
      </PageLayout>
    );
  }
  
  // Loading state
  const isLoading = customersLoading || productsLoading || (isViewMode && salesOrderLoading);
  
  // Actions for the page header
  const actions = (
    <div className="flex gap-2">
      {isViewMode && (
        <PdfExportButton
          url={`/api/export/invoice/${id}`}
          filename={`invoice-${salesOrder?.orderNumber}.pdf`}
        />
      )}
      <Button variant="outline" onClick={() => navigate("/sales-orders")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>
    </div>
  );
  
  return (
    <PageLayout title={isViewMode ? 'sales.saleDetails' : 'sales.addSale'} actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('sales.saleDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sales.customer')}</FormLabel>
                        <Select
                          disabled={isViewMode}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('sales.selectCustomer')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers?.map((customer: any) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('sales.date')}</FormLabel>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          disabled={isViewMode}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t('sales.dueDate')}</FormLabel>
                        <DatePicker
                          date={field.value}
                          onSelect={field.onChange}
                          placeholder={t('sales.dueDate')}
                          disabled={isViewMode}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('sales.notes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('sales.notes')}
                            className="resize-none"
                            disabled={isViewMode}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('sales.items')}</CardTitle>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('sales.addItem')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('sales.product')}</TableHead>
                      <TableHead>{t('sales.quantity')}</TableHead>
                      <TableHead>{t('sales.price')}</TableHead>
                      <TableHead>{t('sales.total')}</TableHead>
                      {!isViewMode && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={isViewMode}
                                  onValueChange={(value) => {
                                    field.onChange(parseInt(value));
                                    handleProductChange(parseInt(value), index);
                                  }}
                                  value={field.value.toString()}
                                  defaultValue={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('sales.selectProduct')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {products?.map((product: any) => (
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      // Update total when quantity changes
                                      const price = form.getValues(`items.${index}.price`);
                                      form.setValue(`items.${index}.total`, parseFloat(e.target.value) * price);
                                    }}
                                    min={1}
                                    disabled={isViewMode}
                                    className="w-20"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(parseFloat(e.target.value));
                                      // Update total when price changes
                                      const quantity = form.getValues(`items.${index}.quantity`);
                                      form.setValue(`items.${index}.total`, quantity * parseFloat(e.target.value));
                                    }}
                                    min={0}
                                    disabled={isViewMode}
                                    className="w-28"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.total`}
                            render={({ field }) => (
                              <div className="font-medium">
                                {formatCurrency(field.value)}
                              </div>
                            )}
                          />
                        </TableCell>
                        {!isViewMode && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-lg font-semibold">
                  {t('sales.totalAmount')}:
                </div>
                <div className="text-lg font-bold">
                  {formatCurrency(form.watch("totalAmount"))}
                </div>
              </CardFooter>
            </Card>
            
            {!isViewMode && (
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/sales-orders")}
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
            )}
          </form>
        </Form>
      )}
    </PageLayout>
  );
}
