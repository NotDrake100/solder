import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IdeaBar } from './components/IdeaBar';
import { ShowcaseCards } from './components/ShowcaseCards';
import { ProductHeader } from './components/ProductHeader';
import { TabsNav, TabKey } from './components/TabsNav';
import { PartsTab } from './components/PartsTab';
import { CaseTab } from './components/CaseTab';
import { WiringTab } from './components/WiringTab';
import { CodeTab } from './components/CodeTab';
import { AgentLogTab } from './components/AgentLogTab';
import { OrderTab } from './components/OrderTab';
import { ShipTab } from './components/ShipTab';
import { ArTab } from './components/ArTab';
import { ProductBuild, AgentLogStep } from './types';
import { fetchShowcase, buildProduct } from './services/api';
import { MOCK_BUILDS } from './data/mockShowcases';
import { Cpu, Sparkles, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedShowcaseId, setSelectedShowcaseId] = useState<string>('sip');
  const [build, setBuild] = useState<ProductBuild>(MOCK_BUILDS['sip']);
  const [activeTab, setActiveTab] = useState<TabKey>('case');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agentLogs, setAgentLogs] = useState<AgentLogStep[]>(MOCK_BUILDS['sip'].agentLog || []);

  // Load showcase build
  const loadShowcase = async (id: string) => {
    setSelectedShowcaseId(id);
    setIsLoading(true);
    try {
      const data = await fetchShowcase(id);
      setBuild(data);
      if (data.agentLog && data.agentLog.length > 0) {
        setAgentLogs(data.agentLog);
      }
    } catch (err) {
      console.error('Failed to load showcase build:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch for sip
    loadShowcase('sip');
  }, []);

  // Handle custom prompt submit
  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    setActiveTab('agent'); // Show live agent logs immediately

    const initialSteps: AgentLogStep[] = [
      { step: 'spec_parse', status: 'running', detail: `Analyzing requirements: "${prompt}"` },
      { step: 'code_gen', status: 'pending', detail: 'Generating firmware & circuit BOM' },
      { step: 'compile', status: 'pending', detail: 'Running compiler (arduino-cli)' },
      { step: 'sim_test', status: 'pending', detail: 'Automated functional simulation' },
      { step: 'case_fit', status: 'pending', detail: 'Calculating 3D enclosure clearance' },
    ];
    setAgentLogs(initialSteps);

    try {
      const result = await buildProduct(prompt, (step) => {
        setAgentLogs((prev) => {
          const idx = prev.findIndex((s) => s.step === step.step);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = step;
            return next;
          }
          return [...prev, step];
        });
      });

      setBuild(result);
      if (result.agentLog && result.agentLog.length > 0) {
        setAgentLogs(result.agentLog);
      }
      setSelectedShowcaseId('');
      // After generation finishes, transition to 3D case viewer
      setTimeout(() => {
        setActiveTab('case');
      }, 700);
    } catch (err) {
      console.error('Build generation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col selection:bg-zinc-200">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-zinc-600" />
            <span>Autonomous Hardware Engineering Agent</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Type an idea. <span className="text-zinc-500 font-medium">Get a build.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            From one sentence to complete maker hardware: verified components in INR (₹), 3D printable snap-fit case, pin-to-pin wiring schematic, and self-testing Arduino C++ firmware.
          </p>
        </div>

        {/* Idea Bar */}
        <IdeaBar onSubmit={handlePromptSubmit} isLoading={isLoading} />

        {/* Showcase Carousel / Cards */}
        <ShowcaseCards
          selectedId={selectedShowcaseId}
          onSelect={loadShowcase}
          isLoading={isLoading}
        />

        {/* Active Product Build Section */}
        <div className="space-y-4 pt-2">
          <ProductHeader build={build} />

          {/* Tab Navigation */}
          <TabsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            partsCount={build.parts?.length || 0}
            hasAgentLog={true}
          />

          {/* Tab Panels */}
          <div className="pt-2">
            {activeTab === 'parts' && (
              <PartsTab parts={build.parts || []} />
            )}

            {activeTab === 'case' && (
              <CaseTab
                layout={build.layout || []}
                caseData={build.case || { outerMm: [140, 100, 45], wallMm: 2, lidType: 'snap' }}
                productName={build.name}
              />
            )}

            {activeTab === 'wiring' && (
              <WiringTab
                wiring={build.wiring || []}
                wiringSvg={build.wiringSvg}
                board={build.board}
              />
            )}

            {activeTab === 'code' && (
              <CodeTab
                code={build.code || { filename: 'sketch.ino', ino: '// No code generated' }}
                board={build.board}
              />
            )}

            {activeTab === 'agent' && (
              <AgentLogTab
                logs={agentLogs}
                isGenerating={isLoading}
              />
            )}

            {activeTab === 'order' && (
              <OrderTab
                parts={build.parts || []}
                productName={build.name}
              />
            )}

            {activeTab === 'ship' && (
              <ShipTab
                product={build.product}
                productName={build.name}
              />
            )}

            {activeTab === 'ar' && (
              <ArTab
                productName={build.name}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 mt-16 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700">Solder</span>
            <span>• Built for Berkeley x DeepMind Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Google Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Antigravity Swarm Architecture</span>
            <span>•</span>
            <span>avr8js & Three.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
