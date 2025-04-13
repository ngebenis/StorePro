import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { user, updateLanguageMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (language: string) => {
    if (user) {
      // If user is logged in, update their preference in the database
      updateLanguageMutation.mutate({ language });
    } else {
      // Otherwise just change the UI language
      i18n.changeLanguage(language);
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="px-3 py-1 rounded text-sm border border-gray-300 flex items-center"
        >
          <Globe className="h-4 w-4 mr-1" />
          <span>{i18n.language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          {t('settings.english')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('id')}>
          {t('settings.indonesian')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
