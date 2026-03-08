import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    openSidebar: () => void;
    closeSidebar: () => void;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: false,
    openSidebar: () => { },
    closeSidebar: () => { },
    toggleSidebar: () => { },
});

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <SidebarContext.Provider
            value={{
                isOpen,
                openSidebar: () => setIsOpen(true),
                closeSidebar: () => setIsOpen(false),
                toggleSidebar: () => setIsOpen((p) => !p),
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => useContext(SidebarContext);
