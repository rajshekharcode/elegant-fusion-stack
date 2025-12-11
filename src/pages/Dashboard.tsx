import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplet, Calendar, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate('/login');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check if user has admin role
  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ['userRole', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: donor, isLoading } = useQuery({
    queryKey: ['donor', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from('donors')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  useEffect(() => {
    if (session && !isLoading && !donor) {
      // User is logged in but doesn't have a donor profile
      navigate('/register');
    }
  }, [session, donor, isLoading, navigate]);

  if (!session || isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p>Loading...</p>
      </div>
    );
  }

  // If user is admin, show admin dashboard
  if (session && !isLoadingRole && userRole) {
    return <AdminDashboard />;
  }

  if (!donor) {
    return null; // Will redirect to register
  }


  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {donor.name}!</h1>
          <p className="text-muted-foreground">Manage your donor profile and track your contributions</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Group</CardTitle>
              <Droplet className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{donor.blood_group}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{donor.donation_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eligibility Status</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <Badge variant={donor.eligible ? "default" : "secondary"}>
                {donor.eligible ? "Eligible" : "Not Eligible"}
              </Badge>
              {donor.eligible_date && !donor.eligible && (
                <p className="text-xs text-muted-foreground mt-2">
                  Eligible from: {new Date(donor.eligible_date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age:</span>
                <span className="font-medium">{donor.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-medium">{donor.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium">{donor.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{donor.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{donor.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
            </CardHeader>
            <CardContent>
              {donor.last_donation_date ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Donation:</span>
                    <span className="font-medium">
                      {new Date(donor.last_donation_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Donations:</span>
                    <span className="font-medium">{donor.donation_count}</span>
                  </div>
                  <div className="p-4 bg-muted rounded-lg mt-4">
                    <p className="text-sm text-center">
                      Thank you for your {donor.donation_count} life-saving donation{donor.donation_count !== 1 ? 's' : ''}!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No donation history yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start your journey by making your first donation!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
