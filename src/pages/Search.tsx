import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Droplet } from "lucide-react";

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("all");

  const { data: bloodStock } = useQuery({
    queryKey: ['blood-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blood_stock')
        .select('*')
        .order('blood_group');
      return data || [];
    },
  });

  const filteredStock = bloodStock?.filter((stock) => {
    const matchesBloodGroup = selectedBloodGroup === "all" || stock.blood_group === selectedBloodGroup;
    const matchesSearch = stock.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBloodGroup && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-500';
      case 'Low Stock': return 'bg-yellow-500';
      case 'Critical': return 'bg-red-500';
      case 'Expired': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Search Blood Stock</h1>
          <p className="text-muted-foreground">Find available blood units by type and location</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedBloodGroup} onValueChange={setSelectedBloodGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Blood Groups</SelectItem>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStock?.map((stock) => (
            <Card key={stock.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-6 w-6 text-destructive" />
                    <span className="text-2xl font-bold">{stock.blood_group}</span>
                  </div>
                  <Badge className={`${getStatusColor(stock.status)} text-white`}>
                    {stock.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Units Available:</span>
                  <span className="font-bold text-xl text-destructive">{stock.units}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{stock.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <span className="font-medium">
                    {new Date(stock.expiry_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="text-sm">
                    {new Date(stock.last_updated).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStock?.length === 0 && (
          <div className="text-center py-12">
            <Droplet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">No blood stock found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
