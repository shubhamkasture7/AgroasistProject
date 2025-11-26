import React from 'react';

type Tab = 'weather' | 'pesticide' | 'analyzer';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    const activeClass = isActive ? 'text-green-600' : 'text-gray-500';
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${activeClass} hover:text-green-600`}>
            {icon}
            <span className="text-xs">{label}</span>
        </button>
    );
};


const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="w-full bg-white shadow-t-md border-t border-gray-200">
      <div className="flex justify-around max-w-lg mx-auto">
        <NavItem 
          label="हवामान" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} 
          isActive={activeTab === 'weather'} 
          onClick={() => setActiveTab('weather')} 
        />
        <NavItem 
          label="कीटकनाशक नोंद" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} 
          isActive={activeTab === 'pesticide'} 
          onClick={() => setActiveTab('pesticide')} 
        />
        <NavItem 
          label="विश्लेषक" 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L10 16l-4 4 4-4 5.293-5.293a1 1 0 011.414 0L21 13" /></svg>} 
          isActive={activeTab === 'analyzer'} 
          onClick={() => setActiveTab('analyzer')} 
        />
      </div>
    </nav>
  );
};

export default BottomNav;
