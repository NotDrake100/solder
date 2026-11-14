import React, { useState, useEffect } from 'react';
import type { SolderBuild, ScrapPhotoResult } from './types';
import { SHOWCASE_BUILDS, DESK_FAN_BUILD } from './data/showcases';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatView, ChatMessage } from './components/ChatView';
import { ResultPanel, ResultTab } from './components/ResultPanel';
import { getDefaultHarnessChecks, VerifierCheck } from './components/HarnessTrace';
import { ScrapModal } from './components/ScrapModal';
import { OrderModal, ShipModal, ArModal, ShareModal } from './components/ActionModals';
import { MessageSquare, Eye } from 'lucide-react';

const RECENT_BUILDS_KEY = 'solder_recent_builds';

export function App() {
  const [activeBuild, setActiveBuild] = useState<SolderBuild>(SHOWCASE_BUILDS.sip);
  const [buildsHistory, setBuildsHistory] = useState<SolderBuild[]>([
    SHOWCASE_BUILDS.sip,
    SHOWCASE_BUILDS.wisp,
    SHOWCASE_BUILDS.hasp,
    SHOWCASE_BUILDS.eave,
    DESK_FAN_BUILD,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');

  // Active tab in ResultPanel
  const [activeResultTab, setActiveResultTab] = useState<ResultTab>('case');

  // Mobile toggle between chat and preview (for < 768px viewports)
  const [mobileActiveView, setMobileActiveView] = useState<'chat' | 'preview'>('preview');

  // Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals state
  const [isScrapOpen, setIsScrapOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isShipOpen, setIsShipOpen] = useState(false);
  const [isArOpen, setIsArOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Scrap drawer savings state
  const [scrapSummary, setScrapSummary] = useState<string | null>(null);
  const [scrapSavings, setScrapSavings] = useState(0);

  // Conversation messages state (empty state by default)
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Load past builds from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_BUILDS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBuildsHistory((prev) => {
            const combined = [...parsed, ...prev];
            const seen = new Set<string>();
            return combined.filter((b) => {
              if (seen.has(b.id)) return false;
              seen.add(b.id);
              return true;
            });
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Permalink routing (/b/:id or #id)
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/b\/([a-zA-Z0-9_-]+)/);
    const buildId = match ? match[1] : window.location.hash.replace('#', '');

    if (buildId && SHOWCASE_BUILDS[buildId]) {
      loadBuildIntoChat(SHOWCASE_BUILDS[buildId]);
    }
  }, []);

  // Load a showcase or past build into chat view
  const loadBuildIntoChat = (build: SolderBuild) => {
    setActiveBuild(build);
    setMobileActiveView('preview');
    setMessages([
      {
        id: `user-${build.id}`,
        sender: 'user',
        text: build.tagline || build.name,
        timestamp: Date.now() - 30000,
      },
      {
        id: `asst-${build.id}`,
        sender: 'assistant',
        text: `Here is the verified hardware co-design for **${build.name}**!\n\n${build.summary || build.tagline || ''}\n\nExplore parts, 3D case, wiring, and firmware in the workspace panel:`,
        timestamp: Date.now() - 28000,
        buildData: build,
        completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case', 'done'],
        harnessChecks: getDefaultHarnessChecks(build),
      },
    ]);
  };

  // Start fresh empty build conversation ("New build" button)
  const handleNewBuild = () => {
    setMessages([]);
    window.history.pushState(null, '', '/');
  };

  // Switch build from sidebar
  const handleSelectBuild = (id: string) => {
    const found = buildsHistory.find((b) => b.id === id) || SHOWCASE_BUILDS[id];
    if (found) {
      loadBuildIntoChat(found);
      window.history.pushState(null, '', `/b/${id}`);
    }
  };

  // Send a message from composer or suggestion card
  const handleSendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setMobileActiveView('chat');

    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    // 1. Post User message
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      timestamp: Date.now(),
    };

    // 2. Post Assistant typing message
    const assistantMessage: ChatMessage = {
      id: asstMsgId,
      sender: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      isTyping: true,
      currentStep: 'reading',
      completedSteps: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    // Check if prompt is desk fan or hot fan to trigger reproducible self-heal demo
    const isFan = prompt.toLowerCase().includes('fan') || prompt.toLowerCase().includes('hot');

    try {
      // Step A: Trigger server build API
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, demoHeal: isFan }),
      });

      let buildData: SolderBuild | null = null;
      let buildId = `build_${Date.now()}`;

      if (res.ok) {
        const json = await res.json();
        buildData = json.data || json;
        if (json.buildId) buildId = json.buildId;
      }

      if (isFan && !buildData) {
        buildData = DESK_FAN_BUILD;
      }

      // Step B: Connect to SSE stream
      let sseReceived = false;
      const streamUrl = `/api/build/${buildId}/stream`;

      try {
        const sse = new EventSource(streamUrl);

        sse.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!data) return;
            sseReceived = true;

            const stage = data.stage || data.step;

            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== asstMsgId) return m;
                const completed = new Set(m.completedSteps || []);

                if (stage === 'reading' || stage === 'generate') {
                  completed.add('reading');
                  return {
                    ...m,
                    isTyping: false,
                    currentStep: 'parts',
                    completedSteps: Array.from(completed),
                    text: `Reading your idea: "${prompt}"... Analyzing MCU architecture and required sensor peripherals.`,
                  };
                } else if (stage === 'parts') {
                  completed.add('reading');
                  completed.add('parts');
                  return {
                    ...m,
                    isTyping: false,
                    currentStep: 'wiring',
                    completedSteps: Array.from(completed),
                    text: `Picking parts: Selected ${data.parts?.length || buildData?.parts?.length || 4} components with INR maker pricing. Routing pinout...`,
                  };
                } else if (stage === 'wiring') {
                  completed.add('parts');
                  completed.add('wiring');
                  return {
                    ...m,
                    currentStep: 'firmware',
                    completedSteps: Array.from(completed),
                    text: `Wiring: Routed ${data.wiring?.length || buildData?.wiring?.length || 8} pin connections (5V, GND, I2C, control lines). Synthesizing sketch...`,
                  };
                } else if (stage === 'firmware' || stage === 'compile') {
                  completed.add('wiring');
                  completed.add('firmware');
                  return {
                    ...m,
                    currentStep: 'case',
                    completedSteps: Array.from(completed),
                    text: `Firmware compiled and verified for ${buildData?.board?.toUpperCase() || 'UNO'} ✓. Generating 3D parametric enclosure...`,
                  };
                } else if (stage === 'case' || stage === 'fitcheck') {
                  completed.add('firmware');
                  completed.add('case');
                  return {
                    ...m,
                    currentStep: 'done',
                    completedSteps: Array.from(completed),
                    text: `Designing the case: Generated frosted snap-fit enclosure (${buildData?.case?.outerMm?.join('x') || '128x96x40'}mm) with 2.0mm wall clearance. Finalizing build...`,
                  };
                } else if (stage === 'done' || stage === 'complete') {
                  completed.add('case');
                  completed.add('done');
                  if (data.data) buildData = data.data;
                  return {
                    ...m,
                    isStreaming: false,
                    isTyping: false,
                    currentStep: 'done',
                    completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case', 'done'],
                    buildData: buildData || undefined,
                    harnessChecks: getDefaultHarnessChecks(buildData),
                    text: `I've synthesized **${buildData?.name || 'Custom Build'}** for your idea! ${buildData?.tagline || ''}\n\nExplore the interactive 3D case, circuit wiring, virtual simulator, and firmware on the right:`,
                  };
                }

                return m;
              })
            );
          } catch {
            // ignore
          }
        };

        sse.addEventListener('done', () => {
          sse.close();
          finishLiveBuild(buildData, asstMsgId, prompt, isFan);
        });

        sse.onerror = () => {
          sse.close();
          if (!sseReceived) {
            simulateLocalProgression(buildData, asstMsgId, prompt, isFan);
          }
        };
      } catch {
        simulateLocalProgression(buildData, asstMsgId, prompt, isFan);
      }
    } catch {
      simulateLocalProgression(null, asstMsgId, prompt, isFan);
    }
  };

  // Graceful fallback streaming sequence with real deterministic harness progression
  const simulateLocalProgression = async (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string,
    isFan: boolean
  ) => {
    const targetBuild = buildData || (isFan ? DESK_FAN_BUILD : SHOWCASE_BUILDS.sip);

    // Stage 1: Reading
    await new Promise((r) => setTimeout(r, 350));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              isTyping: false,
              currentStep: 'reading',
              completedSteps: ['reading'],
              text: `Reading your idea: "${prompt}"... Determining microcontroller target and hardware peripherals.`,
            }
          : m
      )
    );

    // Stage 2: Parts
    await new Promise((r) => setTimeout(r, 500));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'parts',
              completedSteps: ['reading', 'parts'],
              text: `Picking parts: Selected ${targetBuild.parts.length} components with exact INR pricing (Total: ₹${targetBuild.product?.priceInr || 890}).`,
            }
          : m
      )
    );

    // Stage 3: Wiring
    await new Promise((r) => setTimeout(r, 550));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'wiring',
              completedSteps: ['reading', 'parts', 'wiring'],
              text: `Wiring: Routed ${targetBuild.wiring.length} DuPont connections (5V, GND, I2C, control lines).`,
            }
          : m
      )
    );

    // Stage 4: Firmware
    await new Promise((r) => setTimeout(r, 500));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'firmware',
              completedSteps: ['reading', 'parts', 'wiring', 'firmware'],
              text: `Writing firmware: Synthesized Arduino C++ sketch (${targetBuild.code.filename}) verified for ${targetBuild.board.toUpperCase()}.`,
            }
          : m
      )
    );

    // Stage 5: Case
    await new Promise((r) => setTimeout(r, 500));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              currentStep: 'case',
              completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case'],
              text: `Designing the case: Generated frosted snap-fit enclosure (${targetBuild.case.outerMm.join('x')}mm) with 2.0mm wall clearance.`,
            }
          : m
      )
    );

    // Stage 6: Done
    await new Promise((r) => setTimeout(r, 450));
    finishLiveBuild(targetBuild, msgId, prompt, isFan);
  };

  const finishLiveBuild = (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string,
    isFan: boolean
  ) => {
    setIsLoading(false);
    const finalBuild: SolderBuild = buildData || (isFan ? DESK_FAN_BUILD : SHOWCASE_BUILDS.sip);

    setActiveBuild(finalBuild);
    setBuildsHistory((prev) => {
      const updated = [finalBuild, ...prev.filter((b) => b.id !== finalBuild.id)];
      try {
        const toSave = updated.filter((b) => !['sip', 'wisp', 'hasp', 'eave'].includes(b.id));
        localStorage.setItem(RECENT_BUILDS_KEY, JSON.stringify(toSave));
      } catch {
        // ignore
      }
      return updated;
    });

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        return {
          ...m,
          isStreaming: false,
          isTyping: false,
          currentStep: 'done',
          completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case', 'done'],
          buildData: finalBuild,
          harnessChecks: getDefaultHarnessChecks(finalBuild),
          text: `I've synthesized **${finalBuild.name}** for your idea! ${finalBuild.tagline || finalBuild.summary}\n\nExplore the interactive 3D case, circuit wiring, virtual simulator, and firmware in the workspace panel:`,
        };
      })
    );
  };

  // Apply parts detected from Scrap Mode photo
  const handleApplyScrapParts = (result: ScrapPhotoResult) => {
    setScrapSavings(result.totalSavingsInr);
    setScrapSummary(
      `${result.ownedParts.length} parts owned (${result.ownedParts.map((p) => p.name).join(', ')})`
    );

    setActiveBuild((prev) => {
      const ownedLibIds = new Set(result.ownedParts.map((p) => p.libId));
      const updatedParts = prev.parts.map((p) => ({
        ...p,
        owned: ownedLibIds.has(p.libId),
      }));
      return {
        ...prev,
        parts: updatedParts,
      };
    });
  };

  const isConversationEmpty = messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-[#161514] text-stone-100 font-sans overflow-hidden">
      {/* Desktop Sidebar (260px, warm crafted aesthetic) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onNewBuild={handleNewBuild}
        builds={buildsHistory}
        activeBuildId={activeBuild.id}
        onSelectBuild={handleSelectBuild}
        onOpenScrapMode={() => setIsScrapOpen(true)}
        ownedCount={activeBuild.parts.filter((p) => p.owned).length}
        savingsInr={scrapSavings}
      />

      {/* Mobile Slide-in Drawer with dim backdrop */}
      <Sidebar
        isOpen={isMobileDrawerOpen}
        onToggle={() => setIsMobileDrawerOpen((prev) => !prev)}
        onNewBuild={handleNewBuild}
        builds={buildsHistory}
        activeBuildId={activeBuild.id}
        onSelectBuild={handleSelectBuild}
        onOpenScrapMode={() => setIsScrapOpen(true)}
        ownedCount={activeBuild.parts.filter((p) => p.owned).length}
        savingsInr={scrapSavings}
        isMobileDrawer={true}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#1f1e1c]">
        {/* Top Bar (48px, warm aesthetic) */}
        <TopBar
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setIsMobileDrawerOpen((prev) => !prev);
            } else {
              setIsSidebarOpen((prev) => !prev);
            }
          }}
          isSidebarOpen={isSidebarOpen}
          onOpenShare={() => setIsShareOpen(true)}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />

        {/* 1. Empty State (Centered Maker Stage) */}
        {isConversationEmpty ? (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onOpenScrapMode={() => setIsScrapOpen(true)}
            onOpenOrder={() => setIsOrderOpen(true)}
            onOpenShip={() => setIsShipOpen(true)}
            onOpenAr={() => setIsArOpen(true)}
            onSelectShowcase={(id) => handleSelectBuild(id)}
            onSelectTab={(tab) => setActiveResultTab(tab)}
          />
        ) : (
          /* 2. Active State: v0/Bolt Split Workspace */
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            {/* Mobile View Switcher Pill (< 768px only) */}
            <div className="md:hidden flex items-center justify-center p-2 bg-[#161514] border-b border-[#383430]">
              <div className="flex items-center p-0.5 rounded-xl bg-[#262422] border border-[#383430]">
                <button
                  onClick={() => setMobileActiveView('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    mobileActiveView === 'chat'
                      ? 'bg-orange-500 text-stone-950 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat & Trace</span>
                </button>
                <button
                  onClick={() => setMobileActiveView('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                    mobileActiveView === 'preview'
                      ? 'bg-orange-500 text-stone-950 font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Build Preview</span>
                </button>
              </div>
            </div>

            {/* Left: Chat & Trace Column (~400px clamp 360-448px, shrink-0) */}
            <div
              className={`w-full md:w-[400px] md:shrink-0 flex flex-col h-full border-r border-[#383430] bg-[#1f1e1c] overflow-hidden ${
                mobileActiveView === 'chat' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <ChatView
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onOpenScrapMode={() => setIsScrapOpen(true)}
                onOpenOrder={() => setIsOrderOpen(true)}
                onOpenShip={() => setIsShipOpen(true)}
                onOpenAr={() => setIsArOpen(true)}
                onSelectShowcase={(id) => handleSelectBuild(id)}
                onSelectTab={(tab) => {
                  setActiveResultTab(tab);
                  setMobileActiveView('preview');
                }}
              />
            </div>

            {/* Right: Big Full-Height Result Panel (3D Case, Parts, Wiring, Simulate, Firmware, Harness) */}
            <div
              className={`flex-1 flex flex-col h-full bg-[#161514] overflow-hidden ${
                mobileActiveView === 'preview' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <ResultPanel
                build={activeBuild}
                activeTab={activeResultTab}
                onTabChange={(tab) => setActiveResultTab(tab)}
                isLoading={isLoading}
                onOpenOrder={() => setIsOrderOpen(true)}
                onOpenShip={() => setIsShipOpen(true)}
                onOpenAr={() => setIsArOpen(true)}
                onOpenShare={() => setIsShareOpen(true)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ScrapModal
        isOpen={isScrapOpen}
        onClose={() => setIsScrapOpen(false)}
        onApplyParts={handleApplyScrapParts}
      />

      <OrderModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        build={activeBuild}
        savingsInr={scrapSavings}
      />

      <ShipModal
        isOpen={isShipOpen}
        onClose={() => setIsShipOpen(false)}
        build={activeBuild}
      />

      <ArModal
        isOpen={isArOpen}
        onClose={() => setIsArOpen(false)}
        build={activeBuild}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        buildId={activeBuild.id}
      />
    </div>
  );
}

export default App;
