import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useContext } from "react";
import { AuthContext } from "@/hooks/use-auth";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: (props: any) => React.JSX.Element;
}) {
  // Use useContext directly to avoid throwing errors if the context is not available
  const authContext = useContext(AuthContext);
  
  return (
    <Route path={path}>
      {(params) => {
        // If no auth context, show loading
        if (!authContext) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // If loading auth state, show loading
        if (authContext.isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // If not authenticated, redirect to auth page
        if (!authContext.user) {
          return <Redirect to="/auth" />;
        }
        
        // If authenticated, render the component
        return <Component {...params} />;
      }}
    </Route>
  );
}
