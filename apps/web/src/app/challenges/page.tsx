'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ArrowRight, Code2, Tag, Layers, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Challenge {
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isPublished: boolean;
  category?: {
    name: string;
    slug: string;
  };
}

export default function ChallengesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const { data, isLoading } = useQuery<{ challenges: Challenge[] }>({
    queryKey: ['challenges'],
    queryFn: async () => {
      const res = await fetch('/api/v1/challenges');
      if (!res.ok) throw new Error('Failed to load challenges');
      return res.json();
    },
  });

  const challengesList = data?.challenges || [];

  const filtered = challengesList.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || c.difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Challenge Catalog</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore real-world product implementation tasks with official specs and automated evaluations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <label htmlFor="search-challenges-input" className="sr-only">
            Search challenges
          </label>
          <input
            id="search-challenges-input"
            type="text"
            aria-label="Search challenges"
            placeholder="Search challenges by title, keyword, or tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <label htmlFor="difficulty-filter-select" className="sr-only">
            Filter by difficulty
          </label>
          <select
            id="difficulty-filter-select"
            aria-label="Filter by difficulty"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/50 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl space-y-3">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-300">No challenges found</h3>
          <p className="text-slate-500 text-sm">Try searching for a different keyword or resetting filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div key={item.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-6 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-medium uppercase tracking-wider">
                    {item.category?.name || 'Fintech'}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${
                      item.difficulty === 'beginner'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.difficulty === 'intermediate'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {item.difficulty}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-sky-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">v1.0.0</span>
                <Link
                  href={`/challenges/${item.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
