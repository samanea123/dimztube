"use client";

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a redirector. 
// The main page handles search results display.
function Redirector() {
    const router = useRouter();
    useEffect(() => {
        // Redirect to home page, which will handle the search params
        const newUrl = "/" + window.location.search;
        router.replace(newUrl);
    }, [router]);

    return (
        <div className="flex justify-center items-center h-screen">
            <p>Mengarahkan pencarian...</p>
        </div>
    );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Memuat...</div>}>
            <Redirector />
        </Suspense>
    )
}
