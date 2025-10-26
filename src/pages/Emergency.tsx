import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Emergency = () => {
  const [formData, setFormData] = useState({
    patientName: "",
    hospitalName: "",
    bloodGroup: "",
    unitsRequired: "",
    urgency: "",
    contactPerson: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('blood_requests').insert({
        patient_name: formData.patientName,
        hospital_name: formData.hospitalName,
        blood_group: formData.bloodGroup,
        units_required: parseInt(formData.unitsRequired),
        urgency: formData.urgency,
        contact_person: formData.contactPerson,
        phone: formData.phone,
      });

      if (error) throw error;

      toast.success("Emergency request submitted successfully! Our team will contact you shortly.");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-destructive">
          <CardHeader className="text-center bg-destructive text-destructive-foreground rounded-t-lg">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive-foreground rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-3xl">Emergency Blood Request</CardTitle>
            <CardDescription className="text-destructive-foreground/90">
              For urgent blood requirements - Available 24/7
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-center">
                <strong>Emergency Hotline:</strong> +91 1800-EMERGENCY (24/7)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input
                    id="patientName"
                    placeholder="Full name"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name *</Label>
                  <Input
                    id="hospitalName"
                    placeholder="Hospital/Clinic name"
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select
                    value={formData.bloodGroup}
                    onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                  <Label htmlFor="unitsRequired">Units Required *</Label>
                  <Input
                    id="unitsRequired"
                    type="number"
                    min="1"
                    placeholder="Number of units"
                    value={formData.unitsRequired}
                    onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level *</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low - Within a week</SelectItem>
                    <SelectItem value="Medium">Medium - Within 3 days</SelectItem>
                    <SelectItem value="High">High - Within 24 hours</SelectItem>
                    <SelectItem value="Critical">Critical - Immediate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="Name"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-destructive hover:bg-destructive/90 text-lg py-6"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Emergency Request"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                * By submitting this form, you confirm that the information provided is accurate and the request is genuine.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Emergency;
