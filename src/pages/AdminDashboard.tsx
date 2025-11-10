import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Droplet, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminDashboard = () => {
  // Fetch statistics
  const { data: donors } = useQuery({
    queryKey: ['allDonors'],
    queryFn: async () => {
      const { data } = await supabase.from('donors').select('*');
      return data || [];
    },
  });

  const { data: bloodStock } = useQuery({
    queryKey: ['bloodStock'],
    queryFn: async () => {
      const { data } = await supabase.from('blood_stock').select('*');
      return data || [];
    },
  });

  const { data: bloodRequests } = useQuery({
    queryKey: ['bloodRequests'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blood_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  const totalUnits = bloodStock?.reduce((sum, stock) => sum + (stock.units || 0), 0) || 0;
  const pendingRequests = bloodRequests?.filter(req => req.status === 'Pending').length || 0;
  const upcomingEvents = events?.filter(event => event.status === 'Upcoming').length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-500';
      case 'Approved': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      case 'Completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'destructive';
      case 'High': return 'default';
      case 'Medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage blood bank operations and monitor activities</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{donors?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered donors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blood Stock</CardTitle>
              <Droplet className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalUnits}</div>
              <p className="text-xs text-muted-foreground mt-1">Total units available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingRequests}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingEvents}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled events</p>
            </CardContent>
          </Card>
        </div>

        {/* Blood Inventory */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Blood Inventory</CardTitle>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Units Available</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloodStock?.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-bold text-destructive">{stock.blood_group}</TableCell>
                    <TableCell>{stock.units} units</TableCell>
                    <TableCell>{stock.location}</TableCell>
                    <TableCell>{new Date(stock.expiry_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={stock.status === 'Available' ? 'default' : 'secondary'}>
                        {stock.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!bloodStock?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No blood stock data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Blood Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Blood Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bloodRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.patient_name}</TableCell>
                    <TableCell>
                      <span className="font-bold text-destructive">{request.blood_group}</span>
                    </TableCell>
                    <TableCell>{request.hospital_name}</TableCell>
                    <TableCell>{request.units_required} units</TableCell>
                    <TableCell>
                      <Badge variant={getUrgencyColor(request.urgency)}>
                        {request.urgency === 'Critical' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {request.urgency === 'High' && <Clock className="h-3 w-3 mr-1" />}
                        {request.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(request.status)} text-white`}>
                        {request.status === 'Approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        {request.phone}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!bloodRequests?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No blood requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
