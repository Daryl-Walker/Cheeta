import { useState } from "react";

export default function KalshiLinkForm({
  onLink,
  busy,
  error,
}: {
  onLink: (apiKeyId: string, privateKeyPem: string) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [apiKeyId, setApiKeyId] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Connect Kalshi</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Credentials are sent to the Cheeta API over HTTPS and stored server-side
        (Key Vault when configured). They are never saved in this browser and
        never embedded in the app.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onLink(apiKeyId.trim(), privateKeyPem);
        }}
        className="mt-4 space-y-3"
      >
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Kalshi API key ID</span>
          <input
            value={apiKeyId}
            onChange={(e) => setApiKeyId(e.target.value)}
            autoCapitalize="off"
            placeholder="Kalshi API key ID"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-700">Private key PEM</span>
          <textarea
            value={privateKeyPem}
            onChange={(e) => setPrivateKeyPem(e.target.value)}
            placeholder="-----BEGIN PRIVATE KEY-----"
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Connecting…" : "Connect read-only account"}
        </button>
      </form>
    </section>
  );
}
