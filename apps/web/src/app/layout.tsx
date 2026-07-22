import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'CasePrac — Open Source Product Challenge Evaluation Platform',
  description: 'Self-hostable automated functional, visual regression, and accessibility evaluation platform for frontend developers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-dvh flex flex-col font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950/80 py-8 mt-16 text-center text-xs text-slate-500 font-mono">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>CasePrac Core Platform &bull; Open Source Self-Hostable Software</div>
              <div className="flex items-center gap-4">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
                  GitHub Repository
                </a>
                <span>&bull;</span>
                <span>Docs</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
