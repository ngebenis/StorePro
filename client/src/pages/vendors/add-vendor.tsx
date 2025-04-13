import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVendorSchema, InsertVendor } from "@shared/schema";
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

export default function AddVendorPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const params = useParams();
  const { id } = params;
  const isEditMode = !!id;
  
  // Vendor form
  const form = useForm<InsertVendor>({
    resolver: zodResolver(insertVendorSchema),
    defaultValues: {
      code: "",
      name: "",
      phone: "",
      address: "",
    },
  });
  
  // Fetch vendor details for edit mode
  const { 
    data: vendor, 
    isLoading: vendorLoading, 
    error: vendorError 
  } = useQuery({
    queryKey: [`/api/vendors/${id}`],
    enabled: isEditMode,
  });
  
  // Set form values when vendor data is available in edit mode
  useEffect(() => {
    if (isEditMode && vendor) {
      form.reset({
        code: vendor.code,
        name: vendor.name,
        phone: vendor.phone,
        address: vendor.address,
      });
    }
  }, [isEditMode, vendor, form]);
  
  // Create/update vendor mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      if (isEditMode) {
        await apiRequest("PUT", `/api/vendors/${id}`, data);
      } else {
        await apiRequest("POST", "/api/vendors", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      toast({
        title: t('vendors.vendorSaved'),
      });
      navigate("/vendors");
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit handler for vendor form
  const onSubmit = (data: InsertVendor) => {
    mutation.mutate(data);
  };
  
  // Check for errors
  if (isEditMode && vendorError) {
    return (
      <PageLayout title={isEditMode ? 'vendors.editVendor' : 'vendors.addVendor'}>
        <ErrorAlert message={vendorError.message} />
      </PageLayout>
    );
  }
  
  // Actions for the page header
  const actions = (
    <Button variant="outline" onClick={() => navigate("/vendors")}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t('common.back')}
    </Button>
  );
  
  return (
    <PageLayout title={isEditMode ? 'vendors.editVendor' : 'vendors.addVendor'} actions={actions}>
      <Card>
        <CardContent className="pt-6">
          {isEditMode && vendorLoading ? (
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
                        <FormLabel>{t('vendors.code')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('vendors.code')} {...field} />
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
                        <FormLabel>{t('vendors.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('vendors.name')} {...field} />
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
                        <FormLabel>{t('vendors.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('vendors.phone')} {...field} />
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
                          <FormLabel>{t('vendors.address')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('vendors.address')} 
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
                    onClick={() => navigate("/vendors")}
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
