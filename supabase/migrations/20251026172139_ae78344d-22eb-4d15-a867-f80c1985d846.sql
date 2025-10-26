-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Create donors table
CREATE TABLE public.donors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  weight DECIMAL NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  last_donation_date DATE,
  donation_count INTEGER DEFAULT 0,
  badge TEXT DEFAULT 'Bronze' CHECK (badge IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  eligible BOOLEAN DEFAULT true,
  eligible_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blood_stock table
CREATE TABLE public.blood_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units INTEGER NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT 'Main Storage',
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Low Stock', 'Critical', 'Expired')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blood_requests table
CREATE TABLE public.blood_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  blood_group TEXT NOT NULL CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  units_required INTEGER NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Fulfilled', 'Rejected')),
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  request_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  organizer TEXT NOT NULL,
  contact TEXT NOT NULL,
  expected_donors INTEGER DEFAULT 0,
  registered_donors INTEGER DEFAULT 0,
  units_collected INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Upcoming' CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Donors policies (users can view their own data, admins can view all)
CREATE POLICY "Users can view their own donor profile"
  ON public.donors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donor profile"
  ON public.donors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own donor profile"
  ON public.donors FOR UPDATE
  USING (auth.uid() = user_id);

-- Blood stock policies (public read, authenticated write)
CREATE POLICY "Anyone can view blood stock"
  ON public.blood_stock FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage blood stock"
  ON public.blood_stock FOR ALL
  USING (auth.role() = 'authenticated');

-- Blood requests policies (public can create, authenticated can manage)
CREATE POLICY "Anyone can create blood requests"
  ON public.blood_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view blood requests"
  ON public.blood_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update blood requests"
  ON public.blood_requests FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Events policies (public read, authenticated write)
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage events"
  ON public.events FOR ALL
  USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX idx_donors_blood_group ON public.donors(blood_group);
CREATE INDEX idx_donors_email ON public.donors(email);
CREATE INDEX idx_blood_stock_group ON public.blood_stock(blood_group);
CREATE INDEX idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX idx_events_date ON public.events(event_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE ON public.blood_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();