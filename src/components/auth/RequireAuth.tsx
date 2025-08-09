import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  roles?: string[]; // allowed roles, e.g., ["admin"]
}

const RequireAuth: React.FC<Props> = ({ children, roles }) => {
  const location = useLocation();
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(!!roles?.length);
  const [roleAllowed, setRoleAllowed] = useState(!roles?.length);

  // Listen for auth state changes and get initial session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthed(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setIsAuthed(!!user);
      setUserId(user?.id ?? null);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If role restriction is provided, verify user role from profiles table
  useEffect(() => {
    const verifyRole = async () => {
      if (!roles?.length) return;
      if (!userId) {
        setRoleAllowed(false);
        setCheckingRole(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userId)
          .single();
        if (error || !data?.role) {
          setRoleAllowed(false);
        } else {
          setRoleAllowed(roles.includes(String(data.role)));
        }
      } finally {
        setCheckingRole(false);
      }
    };
    verifyRole();
  }, [roles, userId]);

  const loading = checkingSession || checkingRole;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Card className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-heritage border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-muted-foreground">Memeriksa akses...</p>
        </Card>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (roles?.length && !roleAllowed) {
    // User is logged in but does not have the required role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
