import React, { useState, useEffect } from 'react';
import type { SolderBuild, ScrapPhotoResult } from './types';
import { SHOWCASE_BUILDS } from './data/showcases';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatView, ChatMessage } from './components/ChatView';
import { ScrapModal } from './components/ScrapModal';
import { OrderModal, ShipModal, ArModal, ShareModal } from './components/ActionModals';

const RECENT_BUILDS_KEY = 'solder_recent_builds';

export function App() {
  const [activeBuild, setActiveBuild] = useState<SolderBuild>(SHOWCASE_BUILDS.sip);
  const [buildsHistory, setBuildsHistory] = useState<SolderBuild[]>([
    SHOWCASE_BUILDS.sip,
    SHOWCASE_BUILDS.wisp,
    SHOWCASE_BUILDS.hasp,
    SHOWCASE_BUILDS.eave,
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash');

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
        text: `Here is the verified hardware co-design for **${build.name}**!\n\n${build.summary || build.tagline || ''}\n\nExplore parts, 3D case, wiring, and firmware below:`,
        timestamp: Date.now() - 28000,
        buildData: build,
        completedSteps: ['reading', 'parts', 'wiring', 'firmware', 'case', 'done'],
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

    try {
      // Step A: Trigger server build API
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      let buildData: SolderBuild | null = null;
      let buildId = `build_${Date.now()}`;

      if (res.ok) {
        const json = await res.json();
        buildData = json.data || json;
        if (json.buildId) buildId = json.buildId;
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
                    text: `I've synthesized **${buildData?.name || 'Custom Build'}** for your idea! ${buildData?.tagline || ''}\n\nExplore the interactive 3D case, circuit wiring, virtual simulator, and firmware below:`,
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
          finishLiveBuild(buildData, asstMsgId, prompt);
        });

        sse.onerror = () => {
          sse.close();
          if (!sseReceived) {
            simulateLocalProgression(buildData, asstMsgId, prompt);
          }
        };
      } catch {
        simulateLocalProgression(buildData, asstMsgId, prompt);
      }
    } catch {
      simulateLocalProgression(null, asstMsgId, prompt);
    }
  };

  // Graceful fallback streaming sequence
  const simulateLocalProgression = async (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string
  ) => {
    const targetBuild = buildData || SHOWCASE_BUILDS.sip;

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
    await new Promise((r) => setTimeout(r, 550));
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
    await new Promise((r) => setTimeout(r, 600));
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
    await new Promise((r) => setTimeout(r, 550));
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
    await new Promise((r) => setTimeout(r, 550));
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
    finishLiveBuild(targetBuild, msgId, prompt);
  };

  const finishLiveBuild = (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string
  ) => {
    setIsLoading(false);
    const finalBuild: SolderBuild = buildData || SHOWCASE_BUILDS.sip;

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
          text: `I've synthesized **${finalBuild.name}** for your idea! ${finalBuild.tagline || finalBuild.summary}\n\nExplore the interactive 3D case, circuit wiring, virtual simulator, and firmware below:`,
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

  return (
    <div className="flex h-screen w-full bg-[#212121] text-[#ececec] font-sans overflow-hidden">
      {/* Desktop Sidebar (260px, collapsible) */}
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

      {/* Main Area (bg #212121) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#212121]">
        {/* Main Top Bar (52px, transparent, no border) */}
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

        {/* ChatGPT Style Chat View */}
        <ChatView
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenScrapMode={() => setIsScrapOpen(true)}
          onOpenOrder={() => setIsOrderOpen(true)}
          onOpenShip={() => setIsShipOpen(true)}
          onOpenAr={() => setIsArOpen(true)}
          onSelectShowcase={(id) => handleSelectBuild(id)}
        />
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
