export {};

declare global {
  interface GoogleOAuthTokenResponse {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  }

  interface GoogleOAuthTokenClient {
    requestAccessToken: (options?: { prompt?: string }) => void;
  }

  interface GoogleOAuth2 {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      prompt?: string;
      callback: (response: GoogleOAuthTokenResponse) => void;
      error_callback?: (error: unknown) => void;
    }) => GoogleOAuthTokenClient;
  }

  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleOAuth2;
      };
    };
  }
}
