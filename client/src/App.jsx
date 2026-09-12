import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteLayout from './layout/SiteLayout';
import Home from './pages/Home';
import ComponentsIndex from './pages/ComponentsIndex';
import ThinkingPulsePage from './pages/components/ThinkingPulsePage';
import ConfidenceShimmerPage from './pages/components/ConfidenceShimmerPage';
import LiquidContextMeterPage from './pages/components/LiquidContextMeterPage';
import SweepDiffPage from './pages/components/SweepDiffPage';
import SwarmStatusPage from './pages/components/SwarmStatusPage';
import RewindRegeneratePage from './pages/components/RewindRegeneratePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/components" element={<ComponentsIndex />} />
          <Route path="/components/thinking-pulse" element={<ThinkingPulsePage />} />
          <Route path="/components/confidence-shimmer" element={<ConfidenceShimmerPage />} />
          <Route path="/components/liquid-context-meter" element={<LiquidContextMeterPage />} />
          <Route path="/components/sweep-diff" element={<SweepDiffPage />} />
          <Route path="/components/swarm-status" element={<SwarmStatusPage />} />
          <Route path="/components/rewind-regenerate" element={<RewindRegeneratePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
