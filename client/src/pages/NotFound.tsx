import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-red-600">404</span>
          </div>
          <CardTitle className="text-xl font-semibold">Page Not Found</CardTitle>
          <p className="text-gray-600 mt-2">
            The page you're looking for doesn't exist or you don't have permission to access it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
            
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            )}
            
            <Button 
              className="w-full" 
              variant="ghost"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          

        </CardContent>
      </Card>
    </div>
  );
}