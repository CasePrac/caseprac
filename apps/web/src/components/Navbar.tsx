'use client';

import Link from 'next/link';
import { Terminal, Layout, Compass } from 'lucide-react';
import { VersionBadge } from './VersionBadge';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/challenges" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              CasePrac
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                OSS
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Automated UI & API Evaluation Platform</span>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/challenges"
            className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors"
          >
            <Compass className="w-4 h-4" />
            Challenges
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-300 hover:text-sky-400 transition-colors"
          >
            <Layout className="w-4 h-4" />
            Dashboard
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <VersionBadge />
        </div>
      </div>
    </header>
  );
}

