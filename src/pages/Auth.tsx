import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const setSEO = () => {
  document.title = "Login Admin | GIS Warisan Budaya Sasak";
  const desc = "Login Admin untuk input data situs budaya Sasak.";
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", desc);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", window.location.origin + "/auth");
};

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { toast } = useToast();
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSEO();

    // Redirect if already authed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        const redirectTo = location.state?.from || "/admin";
        navigate(redirectTo, { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const redirectTo = location.state?.from || "/admin";
        navigate(redirectTo, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.state]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (securityCode.trim()) {
        const { error: fnError } = await supabase.functions.invoke("apply-admin-role", {
          body: { securityCode: securityCode.trim() },
        });
        if (fnError) {
          console.error("Security code error:", fnError);
          toast({ title: "Kode keamanan tidak valid", description: fnError.message || "Gagal menerapkan hak admin.", variant: "destructive" });
        } else {
          toast({ title: "Berhasil masuk", description: "Hak admin diterapkan. Mengalihkan..." });
        }
      } else {
        // Create regular user profile if no security code
        const { data: userSession } = await supabase.auth.getSession();
        if (userSession?.session?.user) {
          await supabase.from("profiles").upsert({
            user_id: userSession.session.user.id,
            full_name: userSession.session.user.email || "User",
            role: "tourist"
          });
        }
        toast({ title: "Berhasil masuk", description: "Selamat datang kembali." });
      }
      // Navigation will happen via auth state listener
    } catch (err: any) {
      toast({ title: "Gagal masuk", description: err?.message || "Periksa email dan kata sandi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (securityCode.trim()) {
        const { error: fnError } = await supabase.functions.invoke("apply-admin-role", {
          body: { securityCode: securityCode.trim() },
        });
        if (fnError) {
          console.error("Security code error:", fnError);
          toast({ title: "Kode keamanan tidak valid", description: fnError.message || "Security code salah atau belum di-set di Supabase.", variant: "destructive" });
        } else {
          toast({ title: "Security code valid", description: "Hak admin telah diterapkan ke akun Anda." });
        }
      } else {
        // Create regular user profile for signup without security code
        const { data: userSession } = await supabase.auth.getSession();
        if (userSession?.session?.user) {
          await supabase.from("profiles").upsert({
            user_id: userSession.session.user.id,
            full_name: userSession.session.user.email || "User",
            role: "tourist"
          });
        }
      }

      toast({ title: "Registrasi berhasil", description: "Akun aktif tanpa verifikasi email. Mengalihkan..." });
    } catch (err: any) {
      toast({ title: "Gagal daftar", description: err?.message || "Coba email lain", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cultural">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-md mx-auto">
          <Card className="p-6 shadow-cultural">
            <h1 className="text-2xl font-bold text-center mb-2">Portal Admin</h1>
            <p className="text-center text-muted-foreground mb-6">Masuk untuk mengelola dan mengisi data situs budaya.</p>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4 bg-muted/50">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="signup">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="anda@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Kata Sandi</Label>
                  <Input id="password-login" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-login">Security Code (opsional)</Label>
                  <Input id="security-login" type="text" placeholder="Masukkan kode keamanan admin" value={securityCode} onChange={(e) => setSecurityCode(e.target.value)} />
                </div>
                <Button onClick={handleLogin} disabled={loading} className="w-full">
                  {loading ? "Memproses..." : "Masuk"}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="anda@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Kata Sandi</Label>
                  <Input id="password-signup" type="password" placeholder="Minimal 6 karakter" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security-signup">Security Code (opsional)</Label>
                  <Input id="security-signup" type="text" placeholder="Masukkan kode keamanan admin" value={securityCode} onChange={(e) => setSecurityCode(e.target.value)} />
                </div>
                <Button onClick={handleSignup} disabled={loading} className="w-full" variant="secondary">
                  {loading ? "Memproses..." : "Daftar"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Akun baru aktif tanpa verifikasi email.</p>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link to="/" className="underline">Kembali ke Beranda</Link>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({ title: "Berhasil keluar" });
                }}
              >Keluar</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
