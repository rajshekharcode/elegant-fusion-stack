import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-destructive text-destructive-foreground shadow-lg z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 font-bold text-xl">
            <Heart className="h-6 w-6" />
            <span>BloodBank</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              Home
            </Link>
            {session && (
              <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
                Dashboard
              </Link>
            )}
            <Link to="/search" className="hover:opacity-80 transition-opacity">
              Search
            </Link>
            <Link to="/events" className="hover:opacity-80 transition-opacity">
              Events
            </Link>
            <Link to="/contact" className="hover:opacity-80 transition-opacity">
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <>
                <span className="text-sm opacity-90">Welcome!</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-transparent border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
                >
                  <Link to="/login">
                    <User className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <Link
              to="/"
              className="block py-2 hover:opacity-80 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            {session && (
              <Link
                to="/dashboard"
                className="block py-2 hover:opacity-80 transition-opacity"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <Link
              to="/search"
              className="block py-2 hover:opacity-80 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              Search
            </Link>
            <Link
              to="/events"
              className="block py-2 hover:opacity-80 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link
              to="/contact"
              className="block py-2 hover:opacity-80 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-2 space-y-2">
              {session ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full bg-transparent border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground hover:text-destructive"
                  >
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <User className="mr-2 h-4 w-4" />
                      Login
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
                  >
                    <Link to="/register" onClick={() => setIsOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
