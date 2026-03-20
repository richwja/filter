import { BrowserRouter, Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface">
        <header className="border-b border-surface-300 bg-surface-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-surface-950">Filter</h1>
            <span className="rounded-sm bg-pink-600/10 px-2 py-0.5 text-xs font-medium text-pink-500">
              beta
            </span>
          </div>
        </header>
        <main className="p-6">
          <Routes>
            <Route
              path="/"
              element={
                <div className="flex flex-col items-center justify-center gap-4 pt-32">
                  <div className="rounded-xl bg-surface-50 border border-surface-300 p-8 text-center">
                    <h2 className="text-2xl font-semibold text-surface-950 mb-2">
                      Welcome to Filter
                    </h2>
                    <p className="text-surface-600">
                      Automated press inbox triage, powered by Claude.
                    </p>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
