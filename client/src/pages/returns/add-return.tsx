import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProductReturnSchema, insertReturnItemSchema } from "@shared/schema";
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
const returnItemSchema = z.object({
  productId: z.coerce.number().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  price: z.coerce.number().positive("Price must be positive"),
  total: z.coerce.number(),
});

const returnFormSchema = z.object({
  customerId: z.coerce.number().min(1, "Customer is required"),
  salesOrderId: z.coerce.number().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number(),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

export default function AddReturnPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const params = useParams();
  const { id } = params;
  const isViewMode = !!id;
  
  // Form setup
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      customerId: 0,
      salesOrderId: undefined,
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
  const watchCustomerId = form.watch("customerId");
  
  // State for sales orders filtered by customer
  const [customerSalesOrders, setCustomerSalesOrders] = useState<any[]>([]);
  
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
  
  // Fetch sales orders
  const { 
    data: salesOrders, 
    isLoading: salesOrdersLoading, 
    error: salesOrdersError 
  } = useQuery({
    queryKey: ["/api/sales-orders"],
  });
  
  // Fetch return details if in view mode
  const { 
    data: returnData, 
    isLoading: returnLoading, 
    error: returnError 
  } = useQuery({
    queryKey: [`/api/returns/${id}`],
    enabled: isViewMode,
  });
  
  // Filter sales orders when customer changes
  useEffect(() => {
    if (salesOrders && watchCustomerId) {
      const filteredOrders = salesOrders.filter((order: any) => order.customerId === watchCustomerId);
      setCustomerSalesOrders(filteredOrders);
    } else {
      setCustomerSalesOrders([]);
    }
  }, [salesOrders, watchCustomerId]);
  
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
  
  // Set form values when return data is available in view mode
  useEffect(() => {
    if (isViewMode && returnData) {
      form.reset({
        customerId: returnData.customerId,
        salesOrderId: returnData.salesOrderId || undefined,
        date: new Date(returnData.date),
        notes: returnData.notes || "",
        items: returnData.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        totalAmount: returnData.totalAmount,
      });
    }
  }, [isViewMode, returnData, form]);
  
  // Create return mutation
  const mutation = useMutation({
    mutationFn: async (data: ReturnFormValues) => {
      const returnData = {
        customerId: data.customerId,
        salesOrderId: data.salesOrderId || null,
        date: data.date.toISOString().split('T')[0],
        totalAmount: data.totalAmount,
        notes: data.notes,
        status: "pending",
      };
      
      const itemsData = data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));
      
      await apiRequest("POST", "/api/returns", {
        productReturn: returnData,
        items: itemsData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      toast({
        title: t('returns.returnSaved'),
      });
      navigate("/returns");
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
  const onSubmit = (data: ReturnFormValues) => {
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
  const hasError = customersError || productsError || salesOrdersError || (isViewMode && returnError);
  if (hasError) {
    return (
      <PageLayout title={isViewMode ? 'returns.returnDetails' : 'returns.addReturn'}>
        <ErrorAlert message={(customersError || productsError || salesOrdersError || returnError)?.message || "Failed to load data"} />
      </PageLayout>
    );
  }
  
  // Loading state
  const isLoading = customersLoading || productsLoading || salesOrdersLoading || (isViewMode && returnLoading);
  
  // Actions for the page header
  const actions = (
    <div className="flex gap-2">
      {isViewMode && (
        <PdfExportButton
          url={`/api/export/return/${id}`}
          filename={`return-${returnData?.returnNumber}.pdf`}
        />
      )}
      <Button variant="outline" onClick={() => navigate("/returns")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('common.back')}
      </Button>
    </div>
  );
  
  return (
    <PageLayout title={isViewMode ? 'returns.returnDetails' : 'returns.addReturn'} actions={actions}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('returns.returnDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('returns.customer')}</FormLabel>
                        <Select
                          disabled={isViewMode}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('returns.selectCustomer')} />
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
                    name="salesOrderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('returns.salesOrder')}</FormLabel>
                        <Select
                          disabled={isViewMode || !watchCustomerId}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('returns.selectSalesOrder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customerSalesOrders.map((order: any) => (
                              <SelectItem key={order.id} value={order.id.toString()}>
                                {order.orderNumber}
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
                        <FormLabel>{t('returns.date')}</FormLabel>
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('returns.notes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('returns.notes')}
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
                <CardTitle>{t('returns.items')}</CardTitle>
                {!isViewMode && (
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('returns.addItem')}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('returns.product')}</TableHead>
                      <TableHead>{t('returns.quantity')}</TableHead>
                      <TableHead>{t('returns.price')}</TableHead>
                      <TableHead>{t('returns.total')}</TableHead>
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
                                      <SelectValue placeholder={t('returns.selectProduct')} />
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
                  {t('returns.totalAmount')}:
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
                  onClick={() => navigate("/returns")}
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
