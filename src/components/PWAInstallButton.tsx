import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37]/40 bg-[#2B0D17] px-3.5 py-2 text-xs font-medium text-[#E5C158] transition-colors hover:bg-[#3B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#D4AF37]/35 bg-[#2B0D17] px-3.5 py-2 text-xs font-medium text-[#E5C158] transition-colors hover:bg-[#3B1220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Add to Home</span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm md:items-center p-0 md:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-md rounded-t-3xl md:rounded-2xl border border-[#D4AF37]/25 bg-[#1B090F] p-6 pb-8 shadow-2xl">
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[#D4AF37]/25 md:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="ios-install-title"
                    className="font-editorial text-2xl font-semibold text-[#F5EFE6]"
                  >
                    Save Rubric to Home Screen
                  </h3>
                  <p className="mt-1 text-xs text-[#B8A9A3]">
                    Launch directly into your private writing desk offline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Close install instructions"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-[#B8A9A3] hover:bg-[#2B0D17] hover:text-[#F5EFE6]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ol className="mt-5 space-y-3 text-sm text-[#E7DDD2]">
                <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 p-3.5">
                  <span className="font-mono-num text-xs font-medium text-[#D4AF37]">01.</span>
                  <span>
                    Tap the <strong className="text-[#E5C158]">Share</strong> button{' '}
                    <Share className="inline h-3.5 w-3.5 text-[#E5C158] align-text-bottom" aria-hidden="true" />{' '}
                    in your Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-[#0B090A]/60 p-3.5">
                  <span className="font-mono-num text-xs font-medium text-[#D4AF37]">02.</span>
                  <span>
                    Scroll down and choose <strong className="text-[#E5C158]">Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#0B090A] transition-colors hover:bg-[#E5C158]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
