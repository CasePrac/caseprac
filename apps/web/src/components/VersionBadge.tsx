'use client';

import { useEffect, useState } from 'react';
import { GitBranch, ArrowUpCircle, CheckCircle2 } from 'lucide-react';

const CURRENT_VERSION = '1.0.0'; // App version
const GITHUB_REPO = 'caseprac/caseprac';

interface ReleaseInfo {
  latestVersion: string;
  hasUpdate: boolean;
  htmlUrl: string;
}

export function VersionBadge() {
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });
        if (!res.ok) return;

        const data = await res.json();
        const latestTag = (data.tag_name || '').replace(/^v/, '');
        
        if (latestTag && compareVersions(latestTag, CURRENT_VERSION) > 0) {
          setReleaseInfo({
            latestVersion: latestTag,
            hasUpdate: true,
            htmlUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases`,
          });
        } else {
          setReleaseInfo({
            latestVersion: CURRENT_VERSION,
            hasUpdate: false,
            htmlUrl: `https://github.com/${GITHUB_REPO}`,
          });
        }
      } catch (err) {
        // Fallback silently if offline or rate-limited
      }
    }

    checkVersion();
  }, []);

  // Simple semver compare (returns >0 if v1 > v2)
  function compareVersions(v1: string, v2: string): number {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  }

  if (releaseInfo?.hasUpdate) {
    return (
      <a
        href={releaseInfo.htmlUrl}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-2 group"
        title={`New version v${releaseInfo.latestVersion} available on GitHub`}
      >
        <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
        <span>v{CURRENT_VERSION}</span>
        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-sans font-semibold">
          Update v{releaseInfo.latestVersion}
        </span>
      </a>
    );
  }

  return (
    <a
      href={`https://github.com/${GITHUB_REPO}`}
      target="_blank"
      rel="noreferrer"
      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:border-slate-700 transition-colors flex items-center gap-2"
      title="Running latest release"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <GitBranch className="w-3.5 h-3.5 text-slate-400" />
      <span>v{CURRENT_VERSION}</span>
    </a>
  );
}
