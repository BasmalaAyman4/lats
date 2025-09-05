export interface CustomSession {
    user?: {
        id: string;
        mobile?: string;
        token?: string;
        firstName?: string;
        lastName?: string;
        address?: string | null;
    };
    expires: string;
}

export interface SessionStatus {
    session: CustomSession | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    isLoading: boolean;
    isAuthenticated: boolean;
    user?: CustomSession['user'];
    logout: (redirectTo?: string) => Promise<void>;
}
