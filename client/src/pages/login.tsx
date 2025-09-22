import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { 
  User, 
  Shield, 
  UserPlus, 
  KeyRound, 
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'admin' | 'signup' | 'forgot'>('client');

  const handleLogin = async (type: 'client' | 'admin', email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/login/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Login Successful",
          description: result.message,
        });
        
        // Invalidate auth query to refresh user data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect based on user role
        if (type === 'admin') {
          setLocation('/admin');
        } else {
          setLocation('/');
        }
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Account Created Successfully",
          description: "You can now login with your credentials.",
        });
        
        // Switch to client login tab
        setActiveTab('client');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // Simulate forgot password functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
      setActiveTab('client');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ClientLoginForm = () => {
    const [email, setEmail] = useState('client@demo.com');
    const [password, setPassword] = useState('client123');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin('client', email, password);
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold">Client Login</h3>
          <p className="text-sm text-gray-600">Access your bookings and profile</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Demo Credentials:</strong><br />
            Email: client@demo.com<br />
            Password: client123
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="client-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login to Your Account"}
          </Button>
        </form>

        <div className="space-y-3 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('forgot')}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Forgot your password?
          </button>
          
          <div className="text-sm text-gray-600">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
            >
              Sign up here
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AdminLoginForm = () => {
    const [email, setEmail] = useState('admin@demo.com');
    const [password, setPassword] = useState('admin123');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin('admin', email, password);
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold">Admin Login</h3>
          <p className="text-sm text-gray-600">Administrative access only</p>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Demo Admin Credentials:</strong><br />
            Email: admin@demo.com<br />
            Password: admin123
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="Enter admin email"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-password">Admin Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login as Administrator"}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setActiveTab('forgot')}
            className="text-sm text-red-600 hover:text-red-800 hover:underline"
          >
            Forgot admin password?
          </button>
        </div>
      </div>
    );
  };

  const SignUpForm = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        });
        return;
      }

      handleSignUp({
        firstName,
        lastName,
        email,
        phone,
        password,
        role: 'client'
      });
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Create New Account</h3>
          <p className="text-sm text-gray-600">Join Aryen Sports Arena today</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="john.doe@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create My Account"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Login here
          </button>
        </div>
      </div>
    );
  };

  const ForgotPasswordForm = () => {
    const [email, setEmail] = useState('');

    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleForgotPassword(email);
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold">Reset Password</h3>
          <p className="text-sm text-gray-600">Enter your email to receive reset instructions</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Instructions"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <button
            type="button"
            onClick={() => setActiveTab('client')}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Aryen Sports Arena
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {activeTab === 'client' && (
              <div>
                <ClientLoginForm />
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Administrative Access</p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('admin')}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Login
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <div>
                <AdminLoginForm />
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('client')}
                      className="w-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Back to Client Login
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'signup' && <SignUpForm />}
            {activeTab === 'forgot' && <ForgotPasswordForm />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}