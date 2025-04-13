import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface PdfExportButtonProps {
  url: string;
  filename?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
}

export function PdfExportButton({ 
  url, 
  filename = "document.pdf",
  variant = "outline" 
}: PdfExportButtonProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const exportToPdf = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the PDF from the server
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }
      
      // Create a blob from the PDF response
      const blob = await response.blob();
      
      // Create an object URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size="sm" 
      onClick={exportToPdf}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {t('common.export')}
    </Button>
  );
}
