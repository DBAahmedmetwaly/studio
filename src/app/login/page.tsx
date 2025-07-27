
"use client";

import React from "react";
import { AuthProvider } from "@/contexts/auth-context";

// This is a wrapper component because the login form itself is now part of the AuthProvider.
// The AuthProvider will render the login form if the user is not authenticated.
const LoginPageContent = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <p>Redirecting to login...</p>
        </div>
    );
};

export default function LoginPage() {
    return (
        <AuthProvider>
            <LoginPageContent />
        </AuthProvider>
    );
}

