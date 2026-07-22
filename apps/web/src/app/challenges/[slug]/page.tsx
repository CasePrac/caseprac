'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { FileText, Route, Monitor, Code2, Send, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChallengeDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['challenge', slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/challenges/${slug}`);
      if (!res.ok) throw new Error('Failed to load challenge details');
      return res.json();
    },
  });

  const challenge = data?.challenge;
  const activeVersion = data?.activeVersion;
  const manifest = activeVersion?.taskManifest;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!deploymentUrl) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/v1/challenges/${challenge.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentUrl }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Submission failed with status ${res.status}`);
      }

      const json = await res.json();
      router.push(`/dashboard/submissions/${json.submission.id}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-900 rounded" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Challenge not found</h2>
        <Link href="/challenges" className="text-sky-400 hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/challenges" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Challenges
      </Link>

      {/* Header Info */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-semibold uppercase tracking-wider">
                {challenge.category?.name || 'Fintech'}
              </span>
              <span className="px-3 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-xs font-mono">
                Version {activeVersion?.version || '1.0.0'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">{challenge.title}</h1>
          </div>
        </div>

        <p className="text-slate-300 text-base leading-relaxed">{challenge.description}</p>

        {/* Submit Deployment Form */}
        <div className="bg-slate-900/90 p-6 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-400" />
            Submit Deployment URL for Automated Evaluation
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="deployment-url-input" className="sr-only">
              Deployment URL
            </label>
            <input
              id="deployment-url-input"
              type="url"
              required
              aria-label="Deployment URL"
              placeholder="https://my-app.vercel.app or http://localhost:3000"
              value={deploymentUrl}
              onChange={(e) => setDeploymentUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isSubmitting ? 'Submitting...' : 'Run Evaluation'}
            </button>
          </form>

          {submitError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {submitError}
            </div>
          )}
        </div>
      </div>

      {/* Task Specification Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Brief */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-sky-400" />
              Task Brief & Requirements
            </h3>
            <div className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-line font-sans leading-relaxed">
              {activeVersion?.briefMarkdown}
            </div>
          </div>
        </div>

        {/* Requirements Sidebar */}
        <div className="space-y-6">
          {/* Required Routes */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Route className="w-4 h-4 text-emerald-400" />
              Required Routes
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {manifest?.submission?.requiredRoutes?.map((route: string) => (
                <div key={route} className="p-2 rounded bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  {route}
                </div>
              ))}
            </div>
          </div>

          {/* Viewports */}
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Monitor className="w-4 h-4 text-sky-400" />
              Target Viewports
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {manifest?.viewports?.map((vp: any) => (
                <div key={vp.id} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                  <span className="capitalize text-sky-400 font-semibold">{vp.id}</span>
                  <span className="text-slate-400">{vp.width} x {vp.height} px</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
