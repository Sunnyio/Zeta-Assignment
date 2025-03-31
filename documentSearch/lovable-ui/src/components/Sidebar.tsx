
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Upload, 
  BarChart3, 
  History, 
  Menu, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);
  
  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/query', label: 'Query', icon: <Search className="h-5 w-5" /> },
    { path: '/documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
    { path: '/upload', label: 'Upload', icon: <Upload className="h-5 w-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
    { path: '/history', label: 'History', icon: <History className="h-5 w-5" /> },
  ];

  return (
    <div className={cn(
      "fixed top-0 bottom-0 left-0 z-20 flex flex-col bg-white border-r transition-all duration-300",
      expanded ? "w-64" : "w-16"
    )}>
      <div className="flex items-center p-4 border-b">
        {expanded && (
          <div className="font-semibold text-xl text-insight-500">InsightLatency</div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className={cn("ml-auto", !expanded && "mx-auto")}
        >
          {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      <nav className="flex-1 p-3">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                  isActive 
                    ? "bg-insight-100 text-insight-700" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                  !expanded && "justify-center"
                )}
              >
                {item.icon}
                {expanded && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-3 border-t">
        <div className={cn(
          "flex items-center gap-3 p-2.5 text-sm text-muted-foreground",
          !expanded && "justify-center"
        )}>
          {expanded ? (
            <span>© InsightLatency {new Date().getFullYear()}</span>
          ) : (
            <span>©</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
