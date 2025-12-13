import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // ログイン済みの場合はメインページにリダイレクト
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('toast.enterEmailAndPassword'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('toast.passwordMinLength'));
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 新規登録
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;
        
        toast.success(t('toast.signupSuccess'));
        setIsSignUp(false);
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success(t('toast.loginSuccess'));
        navigate("/");
      }
    } catch (error: any) {
      console.error("認証エラー:", error);
      
      if (error.message.includes("Invalid login credentials")) {
        toast.error(t('toast.invalidCredentials'));
      } else if (error.message.includes("Email not confirmed")) {
        toast.error(t('toast.emailNotConfirmed'));
      } else if (error.message.includes("User already registered")) {
        toast.error(t('toast.userAlreadyRegistered'));
      } else {
        toast.error(isSignUp ? t('toast.signupFailed') : t('toast.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-lg bg-primary p-3 mb-4">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('appTitle')}</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? t('signup') : t('login')}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-12 text-base"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={`6${t('minChars')}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-12 text-base"
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={loading}
          >
            {loading ? t('processing') : isSignUp ? t('signup') : t('login')}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline text-base"
              disabled={loading}
            >
              {isSignUp ? t('loginHere') : t('signupHere')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
