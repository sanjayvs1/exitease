import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, LayoutDashboard, FileText, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  if (!user) return null;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
      
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
              <span className="hidden sm:inline">ExitEase</span>
              <span className="sm:hidden">ExitEase</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {user.role === 'HR' && (
              <Button
                variant={location.pathname === '/dash' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate('/dash')}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}
            
            <Button
              variant={location.pathname === '/resign' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/resign')}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">
                {user.role === 'HR' ? 'Submit Resignation' : 'My Resignation'}
              </span>
              <span className="lg:hidden">
                {user.role === 'HR' ? 'Submit' : 'Resignation'}
              </span>
            </Button>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700 hidden lg:inline">{user.username}</span>
              <Badge variant={user.role === 'HR' ? 'default' : 'secondary'}>
                {user.role}
              </Badge>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              variant="ghost"
              size="sm"
              className="text-gray-600"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* User Info */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{user.username}</span>
                <Badge variant={user.role === 'HR' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </div>

              {/* Navigation */}
              {user.role === 'HR' && (
                <Button
                  variant={location.pathname === '/dash' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    navigate('/dash');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              )}
              
              <Button
                variant={location.pathname === '/resign' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  navigate('/resign');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                {user.role === 'HR' ? 'Submit Resignation' : 'My Resignation'}
              </Button>

              {/* Logout */}
              <Button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );



  }
  
