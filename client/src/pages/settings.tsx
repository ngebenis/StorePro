import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageLayout } from "@/components/ui/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Form schemas for settings
const companySettingsSchema = z.object({
  companyName: z.string().min(1, { message: "Company name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  website: z.string().optional(),
  taxId: z.string().optional(),
});

const systemSettingsSchema = z.object({
  defaultLanguage: z.string().min(1, { message: "Default language is required" }),
  enableEmailNotifications: z.boolean().default(false),
  enableStockAlerts: z.boolean().default(true),
  lowStockThreshold: z.coerce.number().min(1).default(5),
  defaultCurrency: z.string().min(1, { message: "Default currency is required" }),
  backupFrequency: z.string().default("daily"),
});

type CompanySettingsValues = z.infer<typeof companySettingsSchema>;
type SystemSettingsValues = z.infer<typeof systemSettingsSchema>;

export default function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("company");
  
  // Fetch company settings
  const { 
    data: companySettings, 
    isLoading: isLoadingCompany, 
    error: companyError 
  } = useQuery({
    queryKey: ["/api/settings/company"],
  });
  
  // Fetch system settings
  const { 
    data: systemSettings, 
    isLoading: isLoadingSystem, 
    error: systemError 
  } = useQuery({
    queryKey: ["/api/settings/system"],
  });
  
  // Company settings form
  const companyForm = useForm<CompanySettingsValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      companyName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxId: "",
    },
  });
  
  // System settings form
  const systemForm = useForm<SystemSettingsValues>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      defaultLanguage: "en",
      enableEmailNotifications: false,
      enableStockAlerts: true,
      lowStockThreshold: 5,
      defaultCurrency: "USD",
      backupFrequency: "daily",
    },
  });
  
  // Update forms when data is loaded
  useEffect(() => {
    if (companySettings) {
      companyForm.reset(companySettings);
    }
  }, [companySettings, companyForm]);
  
  useEffect(() => {
    if (systemSettings) {
      systemForm.reset(systemSettings);
    }
  }, [systemSettings, systemForm]);
  
  // Mutation for updating company settings
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanySettingsValues) => {
      const res = await apiRequest("PATCH", "/api/settings/company", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({
        title: t('settings.company.saveSuccess'),
        description: t('settings.company.saveSuccessDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('settings.company.saveError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating system settings
  const updateSystemMutation = useMutation({
    mutationFn: async (data: SystemSettingsValues) => {
      const res = await apiRequest("PATCH", "/api/settings/system", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: t('settings.system.saveSuccess'),
        description: t('settings.system.saveSuccessDescription'),
      });
    },
    onError: (error) => {
      toast({
        title: t('settings.system.saveError'),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle company form submission
  function onCompanySubmit(data: CompanySettingsValues) {
    updateCompanyMutation.mutate(data);
  }
  
  // Handle system form submission
  function onSystemSubmit(data: SystemSettingsValues) {
    updateSystemMutation.mutate(data);
  }
  
  // Check if user has appropriate role
  const hasAccess = user && ["admin", "owner"].includes(user.role);
  
  if (!hasAccess) {
    return (
      <PageLayout title="settings.title">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg text-gray-600 mb-2">
                You do not have permission to access settings.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }
  
  if (companyError || systemError) {
    return (
      <PageLayout title="settings.title">
        <ErrorAlert message={(companyError || systemError)?.message} />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout title="settings.title">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="company">{t('settings.tabs.company')}</TabsTrigger>
          <TabsTrigger value="system">{t('settings.tabs.system')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.company.title')}</CardTitle>
              <CardDescription>{t('settings.company.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCompany ? (
                <div className="flex justify-center my-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.company.companyName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('settings.company.companyNamePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.company.taxId')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('settings.company.taxIdPlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.company.address')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.company.addressPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.company.phone')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('settings.company.phonePlaceholder')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.company.email')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('settings.company.emailPlaceholder')} type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('settings.company.website')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('settings.company.websitePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={updateCompanyMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {updateCompanyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t('common.save')}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.system.title')}</CardTitle>
              <CardDescription>{t('settings.system.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSystem ? (
                <div className="flex justify-center my-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...systemForm}>
                  <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={systemForm.control}
                        name="defaultLanguage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.system.defaultLanguage')}</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="en">English</option>
                                <option value="id">Indonesian</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="defaultCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.system.defaultCurrency')}</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="USD">USD ($)</option>
                                <option value="IDR">IDR (Rp)</option>
                                <option value="EUR">EUR (€)</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={systemForm.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.system.lowStockThreshold')}</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={systemForm.control}
                        name="backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('settings.system.backupFrequency')}</FormLabel>
                            <FormControl>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                {...field}
                              >
                                <option value="daily">{t('settings.system.daily')}</option>
                                <option value="weekly">{t('settings.system.weekly')}</option>
                                <option value="monthly">{t('settings.system.monthly')}</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={systemForm.control}
                      name="enableEmailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.system.enableEmailNotifications')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.system.enableEmailNotificationsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={systemForm.control}
                      name="enableStockAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('settings.system.enableStockAlerts')}
                            </FormLabel>
                            <FormDescription>
                              {t('settings.system.enableStockAlertsDescription')}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={updateSystemMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {updateSystemMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t('common.save')}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}