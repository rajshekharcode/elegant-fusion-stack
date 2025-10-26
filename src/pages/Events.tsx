import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Droplet } from "lucide-react";

const Events = () => {
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-500';
      case 'Ongoing': return 'bg-green-500';
      case 'Completed': return 'bg-gray-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Blood Donation Events</h1>
          <p className="text-muted-foreground">Join upcoming blood donation camps and make a difference</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl">{event.name}</CardTitle>
                  <Badge className={`${getStatusColor(event.status)} text-white`}>
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organizer</p>
                    <p className="font-medium">{event.organizer}</p>
                    <p className="text-sm text-muted-foreground">{event.contact}</p>
                  </div>
                </div>

                {event.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{event.registered_donors}</p>
                    <p className="text-xs text-muted-foreground">Registered</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Droplet className="h-5 w-5 mx-auto mb-1 text-destructive" />
                    <p className="text-xl font-bold">{event.units_collected}</p>
                    <p className="text-xs text-muted-foreground">Units Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {events?.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No events scheduled yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for upcoming blood donation events
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
