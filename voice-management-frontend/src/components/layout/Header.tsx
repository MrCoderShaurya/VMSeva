import React from 'react';
import { useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();

  const getTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/users')) return 'Users Spreadsheet DB';
    if (path.endsWith('/roles')) return 'Roles Spreadsheet DB';
    return 'Database Overview & Statistics';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-8 text-card-foreground">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold tracking-tight">{getTitle()}</h1>
      </div>
    </header>
  );
};
