import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function PageLayout({ children, title, actions }: PageLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const PageTitle = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - hidden on mobile */}
      <Sidebar />

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={toggleMobileMenu}
          ></div>
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800 transform transition ease-in-out duration-300">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileMenu}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-white"
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <Sidebar />
          </div>
        </div>
      )}

      {/* Mobile menu button - visible only on mobile */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button 
          onClick={toggleMobileMenu}
          className="bg-primary text-white p-3 rounded-full shadow-lg"
        >
          <Menu size={24} />
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} onMobileMenuToggle={toggleMobileMenu} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="max-w-7xl mx-auto">
            <PageTitle />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
