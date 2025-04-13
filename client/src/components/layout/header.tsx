import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import LanguageSwitcher from "./language-switcher";
import { 
  Bell, 
  Menu, 
  User, 
  Settings, 
  LogOut,
  ChevronDown 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title: string;
  onMobileMenuToggle: () => void;
};

export default function Header({ title, onMobileMenuToggle }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  // Simulate notifications (in a real app, this would come from an API)
  useEffect(() => {
    setNotificationCount(3);
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4">
      <div className="flex items-center">
        <button 
          onClick={onMobileMenuToggle}
          className="md:hidden mr-4 text-gray-600"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">{t(title)}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden sm:block">
          <LanguageSwitcher />
        </div>
        
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800">
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                <User size={16} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <Link href="/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('profile.title')}</span>
              </DropdownMenuItem>
            </Link>
            <Link href="/settings">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('settings.title')}</span>
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('auth.login')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
