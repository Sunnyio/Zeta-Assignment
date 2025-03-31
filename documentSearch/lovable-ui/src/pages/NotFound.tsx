
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-insight-500">404</h1>
          <div className="w-16 h-1 bg-insight-400 mx-auto my-4"></div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Page not found</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <Button onClick={() => navigate('/')} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
