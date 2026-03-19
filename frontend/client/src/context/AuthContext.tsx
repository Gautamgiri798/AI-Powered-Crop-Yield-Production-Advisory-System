// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
// Auth endpoints (/login, /signup) now go through the Vite proxy in development.
// In production, VITE_API_BASE_URL should be set. If not set, use relative paths.
const AUTH_API_URL = import.meta.env.VITE_API_BASE_URL || "";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface User {
    id: number;
    username: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    googleLogin: (tokenId: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Use refs for timers and listeners to avoid stale closures
    const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };

    const resetTimer = () => {
        if (!token) return;

        if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

        logoutTimerRef.current = setTimeout(() => {
            logout();
            toast({
                title: "Session Expired",
                description: "You have been logged out due to inactivity.",
                variant: "destructive",
            });
        }, SESSION_TIMEOUT_MS);
    };

    // Load token from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("authUser");

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem("authToken");
                localStorage.removeItem("authUser");
            }
        }
        setIsLoading(false);
    }, []);

    // Setup activity listeners when authenticated
    useEffect(() => {
        if (!token) return;

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        // Initial timer set
        resetTimer();

        // Throttled reset handler
        let lastReset = 0;
        const handleActivity = () => {
            const now = Date.now();
            // Only reset max once every 30 seconds to avoid perf issues
            if (now - lastReset > 30000) {
                resetTimer();
                lastReset = now;
            }
        };

        events.forEach(event => document.addEventListener(event, handleActivity));

        return () => {
            if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
            events.forEach(event => document.removeEventListener(event, handleActivity));
        };
    }, [token]);

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${AUTH_API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Check for 'error' from custom_exception_handler or 'detail' from DRF
                const errorMessage = errorData.error || errorData.detail || "Invalid username or password";
                return {
                    success: false,
                    error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
                };
            }

            const data = await response.json();

            // Store token and user
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("authUser", JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: "Network error. Please try again." };
        }
    };

    const signup = async (username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${AUTH_API_URL}/api/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Handle structured error from custom_exception_handler
                if (errorData.details && typeof errorData.details === 'object') {
                    const details = Object.entries(errorData.details)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(" | ");
                    return { success: false, error: details };
                }

                const errorMessage = errorData.error || errorData.detail || "Signup failed";
                return { 
                    success: false, 
                    error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) 
                };
            }

            const data = await response.json();

            // Auto-login after signup
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("authUser", JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            console.error("Signup error:", error);
            return { success: false, error: "Network error. Please try again." };
        }
    };

    const googleLogin = async (tokenId: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${AUTH_API_URL}/api/auth/google`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ google_id_token: tokenId }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || errorData.detail || "Google login failed";
                return {
                    success: false,
                    error: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
                };
            }

            const data = await response.json();

            // Store token and user
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("authUser", JSON.stringify(data.user));

            return { success: true };
        } catch (error) {
            console.error("Google login error:", error);
            return { success: false, error: "Network error. Please try again." };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                signup,
                googleLogin,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
