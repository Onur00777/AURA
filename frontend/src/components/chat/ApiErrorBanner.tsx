"use client";

type ApiErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export function ApiErrorBanner({ message, onRetry }: ApiErrorBannerProps) {
  return (
    <div className="mx-4 mt-3 rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-100 sm:mx-6">
      <p className="font-medium tracking-tight">API unavailable</p>
      <p className="mt-1 text-[13px] leading-relaxed text-red-200/90">{message}</p>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-red-200/70">
        From the AURA repo root, in a second terminal:
        <br />
        <span className="text-red-100">python3 server.py</span>
        {"  "}or{"  "}
        <span className="text-red-100">.venv/bin/python server.py</span>
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={() => void onRetry()}
          className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[12px] font-medium text-red-100 transition-colors hover:bg-red-400/20"
        >
          Retry connection
        </button>
      ) : null}
    </div>
  );
}
