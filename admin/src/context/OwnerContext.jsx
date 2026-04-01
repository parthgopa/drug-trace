import { createContext, useContext, useState, useEffect } from 'react';

const OwnerContext = createContext();

export const useOwner = () => {
  const context = useContext(OwnerContext);
  if (!context) {
    throw new Error('useOwner must be used within OwnerProvider');
  }
  return context;
};

export const OwnerProvider = ({ children }) => {
  const [selectedOwner, setSelectedOwner] = useState(null);

  // Load selected owner from localStorage on mount
  useEffect(() => {
    const savedOwner = localStorage.getItem('selectedOwner');
    if (savedOwner) {
      try {
        setSelectedOwner(JSON.parse(savedOwner));
      } catch (error) {
        console.error('Failed to parse saved owner:', error);
        localStorage.removeItem('selectedOwner');
      }
    }
  }, []);

  // Save selected owner to localStorage whenever it changes
  useEffect(() => {
    if (selectedOwner) {
      localStorage.setItem('selectedOwner', JSON.stringify(selectedOwner));
    } else {
      localStorage.removeItem('selectedOwner');
    }
  }, [selectedOwner]);

  const selectOwner = (owner) => {
    setSelectedOwner(owner);
  };

  const clearOwner = () => {
    setSelectedOwner(null);
  };

  return (
    <OwnerContext.Provider value={{ selectedOwner, selectOwner, clearOwner }}>
      {children}
    </OwnerContext.Provider>
  );
};
