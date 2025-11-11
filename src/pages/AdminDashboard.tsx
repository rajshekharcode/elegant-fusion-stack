import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Plus,
  X,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [stockForm, setStockForm] = useState({
    bloodGroup: "",
    units: "",
    expiryDate: "",
    location: "Main Storage",
    status: "Available",
  });

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

  // Mutation to update blood request status
  const updateRequestStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // First, get the request details
      const { data: request, error: fetchError } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the status
      const { error } = await supabase
        .from('blood_requests')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;

      // Send email notification if email exists
      if (request?.email) {
        const { error: emailError } = await supabase.functions.invoke('send-status-notification', {
          body: {
            email: request.email,
            patientName: request.patient_name,
            hospitalName: request.hospital_name,
            bloodGroup: request.blood_group,
            unitsRequired: request.units_required,
            status: status,
            contactPerson: request.contact_person,
          },
        });
        
        if (emailError) {
          console.error('Failed to send notification email:', emailError);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      toast.success(`Request ${variables.status.toLowerCase()} successfully`);
      setSelectedRequest(null);
      setDialogAction(null);
    },
    onError: (error) => {
      toast.error(`Failed to update request: ${error.message}`);
    },
  });

  const handleApprove = (request: any) => {
    setSelectedRequest(request);
    setDialogAction('approve');
  };

  const handleReject = (request: any) => {
    setSelectedRequest(request);
    setDialogAction('reject');
  };

  const confirmAction = () => {
    if (selectedRequest && dialogAction) {
      const status = dialogAction === 'approve' ? 'Approved' : 'Rejected';
      updateRequestStatus.mutate({ id: selectedRequest.id, status });
    }
  };

  // Mutation to add blood stock
  const addBloodStock = useMutation({
    mutationFn: async (formData: typeof stockForm) => {
      const { error } = await supabase.from('blood_stock').insert({
        blood_group: formData.bloodGroup,
        units: parseInt(formData.units),
        expiry_date: formData.expiryDate,
        location: formData.location,
        status: formData.status,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodStock'] });
      toast.success('Blood stock added successfully');
      setIsAddStockOpen(false);
      setStockForm({
        bloodGroup: "",
        units: "",
        expiryDate: "",
        location: "Main Storage",
        status: "Available",
      });
    },
    onError: (error) => {
      toast.error(`Failed to add stock: ${error.message}`);
    },
  });

  const handleAddStock = () => {
    if (!stockForm.bloodGroup || !stockForm.units || !stockForm.expiryDate) {
      toast.error('Please fill all required fields');
      return;
    }
    addBloodStock.mutate(stockForm);
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
            <Button size="sm" onClick={() => setIsAddStockOpen(true)}>
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
                  <TableHead>Actions</TableHead>
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
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${request.phone}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          {request.phone}
                        </a>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {request.status === 'Pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request)}
                              disabled={updateRequestStatus.isPending}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request)}
                              disabled={updateRequestStatus.isPending}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {request.status !== 'Pending' && (
                          <span className="text-sm text-muted-foreground">
                            {request.status}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!bloodRequests?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No blood requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Stock Dialog */}
        <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Blood Stock</DialogTitle>
              <DialogDescription>
                Add new blood units to the inventory
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group *</Label>
                <Select
                  value={stockForm.bloodGroup}
                  onValueChange={(value) => setStockForm({ ...stockForm, bloodGroup: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="units">Units *</Label>
                <Input
                  id="units"
                  type="number"
                  min="1"
                  placeholder="Number of units"
                  value={stockForm.units}
                  onChange={(e) => setStockForm({ ...stockForm, units: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={stockForm.expiryDate}
                  onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Storage location"
                  value={stockForm.location}
                  onChange={(e) => setStockForm({ ...stockForm, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={stockForm.status}
                  onValueChange={(value) => setStockForm({ ...stockForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddStockOpen(false)}
                disabled={addBloodStock.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleAddStock} disabled={addBloodStock.isPending}>
                {addBloodStock.isPending ? 'Adding...' : 'Add Stock'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <AlertDialog open={!!dialogAction} onOpenChange={() => setDialogAction(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogAction === 'approve' ? 'Approve Request' : 'Reject Request'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogAction === 'approve' ? (
                  <>
                    Are you sure you want to approve this blood request for{' '}
                    <strong>{selectedRequest?.patient_name}</strong>?
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                      <p><strong>Blood Group:</strong> {selectedRequest?.blood_group}</p>
                      <p><strong>Units Required:</strong> {selectedRequest?.units_required}</p>
                      <p><strong>Hospital:</strong> {selectedRequest?.hospital_name}</p>
                      <p><strong>Urgency:</strong> {selectedRequest?.urgency}</p>
                    </div>
                  </>
                ) : (
                  <>
                    Are you sure you want to reject this blood request for{' '}
                    <strong>{selectedRequest?.patient_name}</strong>? This action will mark the
                    request as rejected.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                className={dialogAction === 'approve' ? '' : 'bg-destructive hover:bg-destructive/90'}
              >
                {dialogAction === 'approve' ? 'Approve' : 'Reject'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
