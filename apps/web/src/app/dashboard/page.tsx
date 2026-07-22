'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Layout, CheckCircle, Clock, AlertTriangle, ArrowRight, ExternalLink, Activity } from 'lucide-react';

interface Submission {
  id: string;
  challengeId: string;
  deploymentUrl: string;
  status: string;
  score: number | null;
  passed: boolean | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ submissions: Submission[] }>({
    queryKey: ['my-submissions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/me/submissions');
      if (!res.ok) throw new Error('Failed to fetch submissions');
      return res.json();
    },
  });

  const submissionsList = data?.submissions || [];
  const totalCount = submissionsList.length;
  const passedCount = submissionsList.filter((s) => s.passed).length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const scoredSubs = submissionsList.filter((s) => s.score !== null);
  const avgScore = scoredSubs.length > 0 ? Math.round(scoredSubs.reduce((a, b) => a + (b.score || 0), 0) / scoredSubs.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Developer Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Track your product challenge submission evaluations and reports.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs font-medium text-slate-400">Total Submissions</div>
          <div className="text-3xl font-bold text-white">{totalCount}</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs font-medium text-slate-400">Passed Challenges</div>
          <div className="text-3xl font-bold text-emerald-400">{passedCount}</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs font-medium text-slate-400">Pass Rate</div>
          <div className="text-3xl font-bold text-sky-400">{passRate}%</div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-1">
          <div className="text-xs font-medium text-slate-400">Average Score</div>
          <div className="text-3xl font-bold text-indigo-400">{avgScore} / 100</div>
        </div>
      </div>

      {/* Recent Submissions List */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Recent Submissions
          </h2>
          <Link href="/challenges" className="text-xs font-semibold text-sky-400 hover:underline">
            + Submit New Attempt
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-900 rounded-xl" />
            ))}
          </div>
        ) : submissionsList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-slate-400 text-sm">No submissions yet</div>
            <Link
              href="/challenges"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:underline"
            >
              Browse challenges catalog
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {submissionsList.map((sub) => (
              <div key={sub.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/30 px-3 rounded-lg transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400">
                      ID: {sub.id.substring(0, 8)}
                    </span>
                    <a
                      href={sub.deploymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-sky-400 hover:underline flex items-center gap-1 font-mono truncate max-w-xs"
                    >
                      {sub.deploymentUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {new Date(sub.createdAt).toLocaleString('en-US', { timeZone: 'UTC' })}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-medium capitalize border ${
                      sub.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : sub.status === 'queued' || sub.status === 'running'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {sub.status}
                  </span>

                  {sub.score !== null && (
                    <span className="font-mono font-bold text-sm text-white bg-slate-900 px-3 py-1 rounded border border-slate-800">
                      {sub.score}/100
                    </span>
                  )}

                  <Link
                    href={`/dashboard/submissions/${sub.id}`}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
                  >
                    View Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
