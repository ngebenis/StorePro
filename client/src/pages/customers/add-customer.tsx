import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCustomerSchema, InsertCustomer } from "@shared/schema";
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
  Card, 
  CardContent 
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function AddCustomerPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const params = useParams();
  const { id } = params;
  const isEditMode = !!id;
  
  // Customer form
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      address: "",
    },
  });
  
  // Fetch customer details for edit mode
  const { 
    data: customer, 
    isLoading: customerLoading, 
    error: customerError 
  } = useQuery({
    queryKey: [`/api/customers/${id}`],
    enabled: isEditMode,
  });
  
  // Set form values when customer data is available in edit mode
  useEffect(() => {
    if (isEditMode && customer) {
      form.reset({
        code: customer.code,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      });
    }
  }, [isEditMode, customer, form]);
  
  // Create/update customer mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      if (isEditMode) {
        await apiRequest("PUT", `/api/customers/${id}`, data);
      } else {
        await apiRequest("POST", "/api/customers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: t('customers.customerSaved'),
      });
      navigate("/customers");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit handler for customer form
  const onSubmit = (data: InsertCustomer) => {
    mutation.mutate(data);
  };
  
  // Check for errors
  if (isEditMode && customerError) {
    return (
      <PageLayout title={isEditMode ? 'customers.editCustomer' : 'customers.addCustomer'}>
        <ErrorAlert message={customerError.message} />
      </PageLayout>
    );
  }
  
  // Actions for the page header
  const actions = (
    <Button variant="outline" onClick={() => navigate("/customers")}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t('common.back')}
    </Button>
  );
  
  return (
    <PageLayout title={isEditMode ? 'customers.editCustomer' : 'customers.addCustomer'} actions={actions}>
      <Card>
        <CardContent className="pt-6">
          {isEditMode && customerLoading ? (
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
                        <FormLabel>{t('customers.code')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('customers.code')} {...field} />
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
                        <FormLabel>{t('customers.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('customers.name')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('customers.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('customers.phone')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('customers.address')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('customers.address')} 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/customers")}
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
