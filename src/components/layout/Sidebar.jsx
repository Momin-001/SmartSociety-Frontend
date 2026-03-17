// src/components/layout/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Bell, 
  DollarSign,
  Menu,
  ChevronLeft
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard' 
    },
    { 
      id: 'users', 
      label: 'Residents', 
      icon: Users, 
      path: '/users' 
    },
    { 
      id: 'complaints', 
      label: 'Complaints', 
      icon: MessageSquare, 
      path: '/complaints' 
    },
    { 
      id: 'announcements', 
      label: 'Announcements', 
      icon: Bell, 
      path: '/announcements' 
    },
    { 
      id: 'bills', 
      label: 'Bills', 
      icon: DollarSign, 
      path: '/bills' 
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gray-100 border-r border-gray-200 transition-all duration-300 flex flex-col`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
            <Users className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h2 className="font-bold text-gray-900 text-lg">Smart Society</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              isActive(item.path)
                ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {sidebarOpen && (
              <span className="font-medium truncate">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Collapse</span>
            </>
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;