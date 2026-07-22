'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, Eye, AlertCircle, RefreshCw, Layers, ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SubmissionReportPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;
  const [activeTab, setActiveTab] = useState<'tests' | 'artifacts'>('tests');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['submission-report', submissionId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/submissions/${submissionId}/report`);
      if (!res.ok) throw new Error('Failed to load report');
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.submission?.status;
      if (status === 'queued' || status === 'running' || status === 'preparing') {
        return 3000;
      }
      return false;
    },
  });

  const submission = data?.submission;
  const challenge = data?.challenge;
  const evalRun = data?.evaluationRun;
  const testResults = data?.testResults || [];
  const artifacts = data?.artifacts || [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-900 rounded" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Report not found</h2>
        <Link href="/dashboard" className="text-sky-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isRunning = submission.status === 'queued' || submission.status === 'running' || submission.status === 'preparing';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-400">Submission #{submissionId.substring(0, 8)}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                  submission.status === 'completed'
                    ? submission.passed
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/20 animate-pulse'
                }`}
              >
                {isRunning ? `Evaluating (${submission.status})` : submission.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">
              {challenge?.title || 'Challenge Evaluation Report'}
            </h1>
            <a
              href={submission.deploymentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1.5"
            >
              {submission.deploymentUrl}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Live Running Spinner */}
        {isRunning && (
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-mono flex items-center gap-3 animate-pulse">
            <Clock className="w-5 h-5 text-sky-400 animate-spin" />
            <div>
              <div className="font-semibold font-sans">Evaluation in progress...</div>
              <div className="text-[11px] text-slate-400">Playwright worker is loading viewports, running functional checks, and scanning accessibility.</div>
            </div>
          </div>
        )}

        {/* Score Breakdown Cards */}
        {evalRun && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-xs font-sans">Overall Score</div>
              <div className="text-3xl font-extrabold text-white">{evalRun.totalScore ?? 0} / 100</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-xs font-sans">Functional</div>
              <div className="text-3xl font-extrabold text-sky-400">{evalRun.functionalScore ?? 0}%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-xs font-sans">Visual Regression</div>
              <div className="text-3xl font-extrabold text-teal-400">{evalRun.visualScore ?? 0}%</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400 text-xs font-sans">Accessibility</div>
              <div className="text-3xl font-extrabold text-indigo-400">{evalRun.accessibilityScore ?? 0}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'tests' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Test Results ({testResults.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('artifacts')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'artifacts' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          Screenshots & Visual Diffs ({artifacts.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tests' ? (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No test results reported yet.</div>
          ) : (
            <div className="space-y-3">
              {testResults.map((tr: any) => (
                <div
                  key={tr.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {tr.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {tr.category}
                        </span>
                        <span className="text-sm font-semibold text-white">{tr.testName}</span>
                      </div>
                      {tr.message && <div className="text-xs font-mono text-slate-400">{tr.message}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 self-end sm:self-auto">
                    <span>{tr.durationMs}ms</span>
                    <span className="font-bold text-white bg-slate-800 px-2 py-1 rounded">{tr.score}/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          {artifacts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">No screenshots available yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {artifacts.map((art: any) => (
                <div key={art.id} className="glass-card p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                    <span className="uppercase text-sky-400 font-semibold">{art.artifactType.replace('_', ' ')}</span>
                    <span>Viewport: {art.viewport || 'default'}</span>
                  </div>
                  <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-800 max-h-96 flex items-center justify-center p-2">
                    <Image
                      src={art.url}
                      alt={art.artifactType}
                      width={800}
                      height={500}
                      unoptimized
                      className="max-h-80 w-auto object-contain rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
