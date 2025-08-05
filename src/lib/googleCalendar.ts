// Google Calendar API Service using @react-oauth/google
interface GoogleCalendarConfig {
  clientId: string;
}

class GoogleCalendarService {
  private config: GoogleCalendarConfig | null = null;
  private isInitialized = false;
  private accessToken: string | null = null;

  async initialize(config: GoogleCalendarConfig): Promise<void> {
    this.config = config;
    
    // Get access token from localStorage (set by OAuth flow)
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      throw new Error('No access token found. Please authenticate with Google first.');
    }
    
    this.accessToken = token;
    this.isInitialized = true;
  }

  async signIn(): Promise<boolean> {
    // For @react-oauth/google, sign in is handled by the OAuth flow
    // We just need to check if we have a valid access token
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      throw new Error('No access token found. Please authenticate with Google first.');
    }
    
    this.accessToken = token;
    this.isInitialized = true;
    return true;
  }

  async signOut(): Promise<void> {
    // Clear the access token
    localStorage.removeItem('google_access_token');
    this.accessToken = null;
    this.isInitialized = false;
  }

  isSignedIn(): boolean {
    const token = localStorage.getItem('google_access_token');
    return !!token && this.isInitialized;
  }

  private async makeGoogleCalendarRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const baseUrl = 'https://www.googleapis.com/calendar/v3';
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Calendar API error: ${errorData.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async createEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    location?: string;
    attendees?: Array<{ email: string }>;
  }): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      const response = await this.makeGoogleCalendarRequest('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to create Google Calendar event: ${error}`);
    }
  }

  async listEvents(startDate: string, endDate: string): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      const params = new URLSearchParams({
        timeMin: startDate,
        timeMax: endDate,
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await this.makeGoogleCalendarRequest(`/calendars/primary/events?${params}`);
      return response.items || [];
    } catch (error) {
      throw new Error(`Failed to fetch Google Calendar events: ${error}`);
    }
  }

  async updateEvent(eventId: string, eventData: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      const response = await this.makeGoogleCalendarRequest(`/calendars/primary/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to update Google Calendar event: ${error}`);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      await this.makeGoogleCalendarRequest(`/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      throw new Error(`Failed to delete Google Calendar event: ${error}`);
    }
  }

  // Method to refresh access token if needed
  async refreshAccessToken(): Promise<void> {
    // For @react-oauth/google, token refresh is handled automatically
    // But we can check if the current token is still valid
    const token = localStorage.getItem('google_access_token');
    if (token) {
      this.accessToken = token;
    } else {
      throw new Error('No access token found. Please re-authenticate.');
    }
  }
}

// Create a singleton instance
export const googleCalendarService = new GoogleCalendarService();

// Helper function to get environment variables
export const getGoogleCalendarConfig = (): GoogleCalendarConfig => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'Google Calendar credentials not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.'
    );
  }

  return { clientId };
}; 