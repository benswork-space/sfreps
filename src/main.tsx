import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import HomePage from "./pages/HomePage";
import "./globals.css";

// Lazy load pages that aren't needed on initial landing
const SupervisorPage = lazy(() => import("./pages/SupervisorPage"));
const MethodologyPage = lazy(() => import("./pages/MethodologyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function Loading() {
  return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-400">Loading...</p></div>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/zip/:zip" element={<SupervisorPage />} />
            <Route path="/zip/:zip/:supervisorId" element={<SupervisorPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
