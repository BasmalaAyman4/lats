"use client";
import { useSession as useNextAuthSession } from 'next-auth/react';
import { logout } from '@/utils/auth.utils';
import type { SessionStatus, CustomSession } from '../types/session.types';

export function useSession(): SessionStatus {
    const { data: session, status } = useNextAuthSession();

    return {
        session: session as CustomSession,
        status,
        isLoading: status === 'loading',
        isAuthenticated: !!session,
        user: session?.user,
        logout
    };
}