import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Droplet, Hospital, Calendar, Heart, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { data: stats } = useQuery({
    queryKey: ['home-stats'],
    queryFn: async () => {
      const [donors, bloodStock, requests, events] = await Promise.all([
        supabase.from('donors').select('id', { count: 'exact', head: true }),
        supabase.from('blood_stock').select('units'),
        supabase.from('blood_requests').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
      ]);

      const totalUnits = bloodStock.data?.reduce((sum, stock) => sum + (stock.units || 0), 0) || 0;

      return {
        donors: donors.count || 0,
        units: totalUnits,
        requests: requests.count || 0,
        events: events.count || 0,
      };
    },
  });

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Save Lives Through{" "}
                <span className="text-destructive">Blood Donation</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join our mission to ensure safe blood supply for everyone. Register as a donor or manage blood inventory efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  <Link to="/register">
                    <Heart className="mr-2 h-5 w-5" />
                    Become a Donor
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/emergency">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Emergency Request
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Users className="h-12 w-12 mx-auto mb-3 text-destructive" />
                <h3 className="text-3xl font-bold text-destructive">{stats?.donors || 0}</h3>
                <p className="text-muted-foreground">Active Donors</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Droplet className="h-12 w-12 mx-auto mb-3 text-destructive" />
                <h3 className="text-3xl font-bold text-destructive">{stats?.units || 0}</h3>
                <p className="text-muted-foreground">Blood Units</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Hospital className="h-12 w-12 mx-auto mb-3 text-destructive" />
                <h3 className="text-3xl font-bold text-destructive">{stats?.requests || 0}</h3>
                <p className="text-muted-foreground">Requests</p>
              </Card>
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-destructive" />
                <h3 className="text-3xl font-bold text-destructive">{stats?.events || 0}</h3>
                <p className="text-muted-foreground">Events</p>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
