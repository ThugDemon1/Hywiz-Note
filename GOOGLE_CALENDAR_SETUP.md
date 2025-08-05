# Google Calendar Integration Setup

This application includes Google Calendar integration for syncing calendar events. Follow these steps to set it up:

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add your domain to "Authorized JavaScript origins":
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Add your domain to "Authorized redirect URIs":
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
6. Copy the Client ID

## 3. Environment Variables

Create a `.env` file in the root directory with:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**Note**: This application uses Vite, so environment variables must be prefixed with `VITE_` instead of `REACT_APP_`. Only the Client ID is needed for the modern OAuth flow.

## 4. Features

Once set up, you can:

- **Connect to Google Calendar**: Modern OAuth 2.0 flow with one-tap login support
- **Sync Events**: Create calendar events and sync them to Google Calendar
- **View Calendar**: Switch between day, week, and month views
- **Automatic Sync**: New events are automatically synced when created

## 5. Permissions

The app requests the following Google Calendar permissions:
- `https://www.googleapis.com/auth/calendar.events` - Create and manage calendar events

## 6. Troubleshooting

- Make sure your Client ID is correct
- Check that the Google Calendar API is enabled
- Verify your domain is in the authorized origins
- Check browser console for any error messages
- Ensure you're using HTTPS in production (OAuth requires secure context)

## 7. Security Notes

- Never commit your `.env` file to version control
- Use different credentials for development and production
- The OAuth flow handles token management securely
- Access tokens are stored locally and automatically refreshed
- Monitor your API usage in Google Cloud Console 