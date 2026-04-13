"use client";

import { useState } from "react";

export default function TestPage() {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkConnection() {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">API Proxy Test</h1>
      <p className="text-gray-500">
        Click the button to test the connection to the Express backend.
      </p>
      <button
        onClick={checkConnection}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Checking..." : "Test Connection"}
      </button>

      {response && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
          <p className="font-semibold">Connected successfully:</p>
          <pre className="mt-2 text-sm">{response}</pre>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Connection failed:</p>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}
    </main>
  );
}
