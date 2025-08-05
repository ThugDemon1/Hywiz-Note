import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { useGoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useCalendarStore } from '../stores/useCalendarStore';

interface GoogleCalendarAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleCalendarAuth: React.FC<GoogleCalendarAuthProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const { 
    isGoogleCalendarConnected, 
    connectGoogleCalendar, 
    disconnectGoogleCalendar,
    error 
  } = useCalendarStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setAuthError(error);
      onError?.(error);
    }
  }, [error, onError]);

  // Modern Google OAuth login hook
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setAuthError(null);
        
        // Store the access token for Google Calendar API calls
        localStorage.setItem('google_access_token', tokenResponse.access_token);
        
        // Connect to calendar using the new token
        await connectGoogleCalendar();
        onSuccess?.();
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to connect to Google Calendar';
        setAuthError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      const errorMessage = 'Google login failed. Please try again.';
      setAuthError(errorMessage);
      onError?.(errorMessage);
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
    flow: 'implicit'
  });

  // One-tap login for better UX
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      try {
        setIsLoading(true);
        setAuthError(null);
        
        // For one-tap login, we need to get the access token
        // This will trigger the regular login flow
        login();
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to connect to Google Calendar';
        setAuthError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false);
      }
    },
    onError: () => {
      // One-tap login failed, user can still use the regular button
      console.log('One-tap login failed');
    }
  });

  const handleConnect = () => {
    setIsLoading(true);
    setAuthError(null);
    login();
  };

  const handleDisconnect = async () => {
    try {
      await disconnectGoogleCalendar();
      // Clear stored tokens
      localStorage.removeItem('google_access_token');
    } catch (error) {
      console.error('Failed to disconnect from Google Calendar:', error);
    }
  };

  if (isGoogleCalendarConnected) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg ${className}`}>
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Connected to Google Calendar
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Events will sync automatically
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 underline"
        >
          <LogOut className="w-3 h-3" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-400" />
        ) : (
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
        </span>
      </button>
      
      {authError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">
            {authError}
          </p>
        </div>
      )}
      
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Connect your Google Calendar to sync events automatically
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Secure OAuth 2.0 authentication
        </p>
      </div>
    </div>
  );
};

export default GoogleCalendarAuth; 