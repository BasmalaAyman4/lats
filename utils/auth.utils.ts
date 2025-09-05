'use client';

import { signOut } from 'next-auth/react';

export const logout = async (redirectTo: string = '/'): Promise<void> => {
    try {
        await signOut({
            callbackUrl: redirectTo,
            redirect: true
        });
    } catch (error) {
        console.error('Logout failed:', error);
        window.location.href = redirectTo;
    }
};