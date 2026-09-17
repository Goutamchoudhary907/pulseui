import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SiteLayout from './layout/SiteLayout';
import ScrollToTop from './lib/ScrollToTop';
import Home from './pages/Home';
import ComponentsIndex from './pages/ComponentsIndex';
import NotFound from './pages/NotFound';
import ThinkingIndicatorPage from './pages/components/ThinkingIndicatorPage';
import ConfidenceTextPage from './pages/components/ConfidenceTextPage';
import ContextMeterPage from './pages/components/ContextMeterPage';
import CodeDiffPage from './pages/components/CodeDiffPage';
import AgentStatusPage from './pages/components/AgentStatusPage';
import RegeneratePage from './pages/components/RegeneratePage';
import TimerPage from './pages/components/TimerPage';
import StreamingTextPage from './pages/components/StreamingTextPage';
import ToolCallPage from './pages/components/ToolCallPage';
import HoldToAllowPage from './pages/components/HoldToAllowPage';
import ImageRevealPage from './pages/components/ImageRevealPage';
import FileChunkerPage from './pages/components/FileChunkerPage';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/components" element={<ComponentsIndex />} />
          <Route path="/components/thinking-indicator" element={<ThinkingIndicatorPage />} />
          <Route path="/components/confidence-text" element={<ConfidenceTextPage />} />
          <Route path="/components/context-meter" element={<ContextMeterPage />} />
          <Route path="/components/code-diff" element={<CodeDiffPage />} />
          <Route path="/components/agent-status" element={<AgentStatusPage />} />
          <Route path="/components/regenerate" element={<RegeneratePage />} />
          <Route path="/components/timer" element={<TimerPage />} />
          <Route path="/components/streaming-text" element={<StreamingTextPage />} />
          <Route path="/components/tool-call" element={<ToolCallPage />} />
          <Route path="/components/hold-to-allow" element={<HoldToAllowPage />} />
          <Route path="/components/image-reveal" element={<ImageRevealPage />} />
          <Route path="/components/file-chunker" element={<FileChunkerPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
