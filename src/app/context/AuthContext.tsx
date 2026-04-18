import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  idNumber: string;
  userType: 'driver' | 'passenger';
  profilePicture?: string;
  rating: number;
  dispatchCash: number;
  clockedIn?: boolean;
  documentsVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, userType: 'driver' | 'passenger') => boolean;
  register: (userData: Omit<User, 'id' | 'rating' | 'dispatchCash'> & { password: string }) => boolean;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  resetPassword: (identifier: string) => boolean;

  interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // change from false to true
  
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false); // done reading
  }, []);

  const login = (username: string, password: string, userType: 'driver' | 'passenger'): boolean => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(
      (u: any) => u.username === username && u.password === password && u.userType === userType
    );

    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return true;
    }
    return false;
  };

  const register = (userData: Omit<User, 'id' | 'rating' | 'dispatchCash'> & { password: string }): boolean => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if username or email already exists
    if (users.some((u: any) => u.username === userData.username || u.email === userData.email)) {
      return false;
    }

    // Generate user ID
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const prefix = userData.userType === 'driver' ? 'd' : 'p';
    const id = `${prefix}${year}${randomDigits}`;

    const newUser = {
      ...userData,
      id,
      rating: 5.0,
      dispatchCash: userData.userType === 'passenger' ? 0 : 0,
      clockedIn: false,
      documentsVerified: false,
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // Update in users array
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData };
      localStorage.setItem('users', JSON.stringify(users));
    }
  };

  const resetPassword = (identifier: string): boolean => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(
      (u: any) => u.email === identifier || u.phoneNumber === identifier
    );

    if (foundUser) {
      // In a real app, this would send an email/SMS
      // For demo purposes, we'll just log it
      console.log('Password reset link sent to:', identifier);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
