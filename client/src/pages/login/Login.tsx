import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Fingerprint, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const homePath = user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      navigate(homePath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please supply both email and password parameters.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Redirect will be handled by the useEffect above upon state update
    } catch (err: any) {
      console.error('Login attempt failed:', err);
      setErrorMsg(err.message || 'Credentials invalid. Please try again.');
      setLoading(false);
    }
  };

  const autofillDemo = (role: 'ADMIN' | 'EMPLOYEE') => {
    if (role === 'ADMIN') {
      setEmail('admin@geoshield.ai');
    } else {
      setEmail('employee@geoshield.ai');
    }
    setPassword('Password123');
    setErrorMsg(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-glow-blue">
            <Fingerprint className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-sans uppercase">
            GeoShield <span className="text-primary font-black">AI</span>
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs">
            Secure location-validated attendance & corporate workforce insights platform
          </p>
        </div>

        {/* Credentials Form Card */}
        <Card glass={true} className="p-2 shadow-premium border border-border/40">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter credentials below to access your workforce terminal</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              
              {/* Error Alert Card */}
              {errorMsg && (
                <div className="flex items-center space-x-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-left text-xs text-danger">
                  <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
                  <span className="font-medium leading-tight">{errorMsg}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Corporate Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com" 
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                  required
                />
              </div>

            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" isLoading={loading} variant="primary" size="md" className="w-full text-xs font-bold py-2">
                Authorize Terminal Session
              </Button>

              {/* Demo Account Seeding Autofill buttons */}
              <div className="w-full border-t border-border pt-4 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                  Autofill Seeded Demo Profiles
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button 
                    type="button"
                    onClick={() => autofillDemo('EMPLOYEE')} 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-[10px] border border-border bg-transparent hover:bg-accent"
                  >
                    Sarah (Employee)
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => autofillDemo('ADMIN')} 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-[10px] border border-border bg-transparent hover:bg-accent"
                  >
                    Admin Account
                  </Button>
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  );
};
