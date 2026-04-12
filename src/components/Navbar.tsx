'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-[#0F2A5C] text-white sticky top-0 z-[9999]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Bridge<span className="text-amber-400">Wait</span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/bridges" className="hover:text-amber-400 transition">Bridges</Link>
            <Link href="/api-docs" className="hover:text-amber-400 transition">API</Link>
            <Link href="/app" className="hover:text-amber-400 transition">App</Link>
          </div>
          <button
            className="md:hidden p-2"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/10 px-4 pb-4 space-y-2">
          <Link href="/bridges" className="block py-2 hover:text-amber-400" onClick={() => setOpen(false)}>Bridges</Link>
          <Link href="/api-docs" className="block py-2 hover:text-amber-400" onClick={() => setOpen(false)}>API</Link>
          <Link href="/app" className="block py-2 hover:text-amber-400" onClick={() => setOpen(false)}>App</Link>
        </div>
      )}
    </nav>
  );
}
