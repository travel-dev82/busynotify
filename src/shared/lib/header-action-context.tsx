// =====================================================
// HEADER ACTION CONTEXT - Dynamic Header Actions per Page
// =====================================================

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HeaderActionContextType {
  // The actions to render in the header
  headerActions: React.ReactNode;
  // Set header actions from a page
  setHeaderActions: (actions: React.ReactNode) => void;
  // Clear header actions when leaving page
  clearHeaderActions: () => void;
}

const HeaderActionContext = createContext<HeaderActionContextType | undefined>(undefined);

export function HeaderActionProvider({ children }: { children: ReactNode }) {
  const [headerActions, setHeaderActionsState] = useState<React.ReactNode>(null);

  const setHeaderActions = useCallback((actions: React.ReactNode) => {
    setHeaderActionsState(actions);
  }, []);

  const clearHeaderActions = useCallback(() => {
    setHeaderActionsState(null);
  }, []);

  return (
    <HeaderActionContext.Provider
      value={{
        headerActions,
        setHeaderActions,
        clearHeaderActions,
      }}
    >
      {children}
    </HeaderActionContext.Provider>
  );
}

export function useHeaderActions() {
  const context = useContext(HeaderActionContext);
  if (context === undefined) {
    throw new Error('useHeaderActions must be used within a HeaderActionProvider');
  }
  return context;
}

// Hook to set header actions on mount and clear on unmount
export function useSetHeaderActions(actions: React.ReactNode) {
  const { setHeaderActions, clearHeaderActions } = useHeaderActions();

  React.useEffect(() => {
    setHeaderActions(actions);
    return () => {
      clearHeaderActions();
    };
  }, [actions, setHeaderActions, clearHeaderActions]);
}
