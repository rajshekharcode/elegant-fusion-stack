import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    age: "",
    gender: "",
    bloodGroup: "",
    weight: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user already has a donor profile
        const { data: donor } = await supabase
          .from('donors')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (donor) {
          // User already has a profile, redirect to dashboard
          navigate("/dashboard");
        } else {
          // Pre-fill email for logged-in users
          setFormData(prev => ({ ...prev, email: session.user.email || '' }));
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is logged in, just create donor profile
        const { error: profileError } = await supabase.from('donors').insert({
          user_id: session.user.id,
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          blood_group: formData.bloodGroup,
          weight: parseFloat(formData.weight),
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });

        if (profileError) throw profileError;

        toast.success("Donor profile created successfully!");
        navigate("/dashboard");
      } else {
        // New user registration
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (authError) throw authError;

        // Create donor profile
        const { error: profileError } = await supabase.from('donors').insert({
          user_id: authData.user?.id,
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          blood_group: formData.bloodGroup,
          weight: parseFloat(formData.weight),
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        });

        if (profileError) throw profileError;

        toast.success("Registration successful! Please check your email to verify your account.");
        navigate("/login");
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl">Become a Donor</CardTitle>
            <CardDescription>Register to save lives through blood donation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                {!formData.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              {!formData.email && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="65"
                    min="45"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Select value={formData.bloodGroup} onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}>
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
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-destructive hover:bg-destructive/90"
                disabled={loading}
              >
                {loading ? "Registering..." : "Register as Donor"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
