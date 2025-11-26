import React, { useState } from 'react';
import WeatherPage from './WeatherPage';
import PesticidePage from './PesticidePage';
import AnalyzerPage from './AnalyzerPage';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';

type Tab = 'weather' | 'pesticide' | 'analyzer';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('weather');
  const { user, logout } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'weather':
        return <WeatherPage />;
      case 'pesticide':
        return <PesticidePage />;
      case 'analyzer':
        return <AnalyzerPage />;
      default:
        return <WeatherPage />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-2xl">
      <header className="flex items-center justify-between p-4 bg-green-600 text-white shadow-md">
        <div>
          <h1 className="text-xl font-bold">Krushidoot</h1>
          <p className="text-sm">Welcome, {user?.displayName}!</p>
        </div>
        <button onClick={logout} className="p-2 rounded-full hover:bg-green-700 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 bg-green-50">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default MainLayout;