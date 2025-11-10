-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'donor');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- RLS: Only admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update RLS policies for admin access on blood_requests
CREATE POLICY "Admins can manage all blood requests"
ON public.blood_requests FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update blood_stock policies for admin access
DROP POLICY IF EXISTS "Authenticated users can manage blood stock" ON public.blood_stock;

CREATE POLICY "Admins can manage blood stock"
ON public.blood_stock FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update events policies for admin access
DROP POLICY IF EXISTS "Authenticated users can manage events" ON public.events;

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all donor profiles
CREATE POLICY "Admins can view all donors"
ON public.donors FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));