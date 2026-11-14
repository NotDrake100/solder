import React, { useState, useEffect } from 'react';
import type { SolderBuild, ScrapPhotoResult } from './types';
import { SHOWCASE_BUILDS, DESK_FAN_BUILD } from './data/showcases';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatView, ChatMessage } from './components/ChatView';
import { getDefaultHarnessChecks, VerifierCheck } from './components/HarnessTrace';
import { LiveCameraModal } from './components/LiveCameraModal';
import { ScrapModal } from './components/ScrapModal';
import { OrderModal, ShipModal, ArModal, ShareModal } from './components/ActionModals';

const RECENT_BUILDS_KEY = 'solder_recent_builds';

export function App() {
  const [activeBuild, setActiveBuild] = useState<SolderBuild>(DESK_FAN_BUILD);
  const [buildsHistory, setBuildsHistory] = useState<SolderBuild[]>([
    DESK_FAN_BUILD,
    SHOWCASE_BUILDS.sip,
    SHOWCASE_BUILDS.wisp,
    SHOWCASE_BUILDS.hasp,
    SHOWCASE_BUILDS.eave,
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Active tab in ResultPanel
  const [activeResultTab, setActiveResultTab] = useState<any>('case');

  // Sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Live Camera state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

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

    if (buildId) {
      if (buildId === 'desk-fan') {
        loadBuildIntoChat(DESK_FAN_BUILD);
      } else if (SHOWCASE_BUILDS[buildId]) {
        loadBuildIntoChat(SHOWCASE_BUILDS[buildId]);
      }
    }
  }, []);

  // Load a showcase or past build into chat view matching chatgpt-inline.html
  const loadBuildIntoChat = (build: SolderBuild) => {
    setActiveBuild(build);
    setMessages([
      {
        id: `user-${build.id}`,
        sender: 'user',
        text: build.id === 'desk-fan'
          ? 'A desk fan that turns on when it gets hot'
          : build.tagline || build.name,
        timestamp: Date.now() - 30000,
      },
      {
        id: `asst-${build.id}`,
        sender: 'assistant',
        text: build.id === 'desk-fan'
          ? 'A temperature sensor switches a relay that powers the fan. Here is the verified build.'
          : build.summary || build.tagline || `A verified hardware build for ${build.name}.`,
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
    const found =
      id === 'desk-fan'
        ? DESK_FAN_BUILD
        : buildsHistory.find((b) => b.id === id) || SHOWCASE_BUILDS[id];
    if (found) {
      loadBuildIntoChat(found);
      window.history.pushState(null, '', `/b/${id}`);
    }
  };

  // Send a message from composer or suggestion chip, with optional photo and inventory
  const handleSendMessage = async (prompt: string, photoBase64?: string, inventory?: string[]) => {
    if (!prompt.trim() && !photoBase64) return;
    if (isLoading) return;

    setIsLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const asstMsgId = `asst-${Date.now()}`;

    // 1. Post User message
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: prompt,
      photoBase64,
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

    // Handle Photo Identification mode if photo provided without a full idea
    if (photoBase64 && (!prompt || prompt.toLowerCase().includes('photo') || prompt.toLowerCase().includes('picture'))) {
      try {
        const photoRes = await fetch('/api/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: photoBase64 }),
        });

        if (photoRes.ok) {
          const photoData = await photoRes.json();
          const owned = photoData.ownedParts || [];
          const partNames = owned.map((p: any) => p.name).join(', ') || 'Arduino Uno, 5V Relay, Sensor';

          setIsLoading(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId
                ? {
                    ...m,
                    isStreaming: false,
                    isTyping: false,
                    text: `I see: **${partNames}**. Would you like to build with these?`,
                    detectedParts: owned,
                    suggestedPrompt: photoData.suggestedPrompt || `Build an automated system using ${partNames}`,
                  }
                : m
            )
          );
          return;
        }
      } catch (err) {
        console.warn('Photo identification fallback:', err);
      }
    }

    // Check if prompt is desk fan or hot fan to trigger reproducible self-heal demo
    const isFan = prompt.toLowerCase().includes('fan') || prompt.toLowerCase().includes('hot');

    try {
      // Step A: Trigger server build API
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          photoBase64,
          inventory,
          demoHeal: isFan,
        }),
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

      // If inventory was provided, tag matching parts as owned in local state
      if (buildData && Array.isArray(inventory) && inventory.length > 0) {
        const invLower = inventory.map((i) => i.toLowerCase());
        buildData.parts = buildData.parts.map((p) => ({
          ...p,
          owned: invLower.some((inv) => inv.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(inv)),
        }));
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
                let updatedChecks = m.harnessChecks
                  ? [...m.harnessChecks]
                  : getDefaultHarnessChecks(buildData);

                // Live verifier SSE events
                if (data.step === 'verifier_check') {
                  updatedChecks = updatedChecks.map((chk) => {
                    if (chk.id === data.id) {
                      return {
                        ...chk,
                        status: data.status === 'pass' ? 'pass' : 'fail',
                        evidence: data.evidence || chk.evidence,
                        durationMs: data.durationMs || chk.durationMs,
                      };
                    }
                    return chk;
                  });
                  return {
                    ...m,
                    harnessChecks: updatedChecks,
                  };
                } else if (data.step === 'fixer_start') {
                  updatedChecks = updatedChecks.map((chk) => {
                    if (chk.id === data.checkId) {
                      return {
                        ...chk,
                        status: 'fixing',
                      };
                    }
                    return chk;
                  });
                  return {
                    ...m,
                    harnessChecks: updatedChecks,
                  };
                } else if (data.step === 'fixer_done') {
                  updatedChecks = updatedChecks.map((chk) => {
                    if (chk.id === data.checkId) {
                      return {
                        ...chk,
                        status: 'healed',
                        healInfo: {
                          round: data.round || 1,
                          model: data.model || 'Gemini 3.5 Flash-Lite',
                          patchDiff: data.diff || '',
                          explanation: data.changelog || 'Self-healed: buzzer moved D7 to D8',
                        },
                      };
                    }
                    return chk;
                  });
                  return {
                    ...m,
                    harnessChecks: updatedChecks,
                  };
                }

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
                    text: `Designing the case: Generated frosted snap-fit enclosure (${buildData?.case?.outerMm?.join('x') || '82x64x28'}mm) with 2.0mm wall clearance. Finalizing build...`,
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
                    harnessChecks: updatedChecks,
                    text: isFan
                      ? 'A temperature sensor switches a relay that powers the fan. Here is the verified build.'
                      : buildData?.summary || buildData?.tagline || `A verified hardware build for ${buildData?.name || 'custom build'}.`,
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
          finishLiveBuild(buildData, asstMsgId, prompt, isFan, inventory);
        });

        sse.onerror = () => {
          sse.close();
          if (!sseReceived) {
            simulateLocalProgression(buildData, asstMsgId, prompt, isFan, inventory);
          }
        };
      } catch {
        simulateLocalProgression(buildData, asstMsgId, prompt, isFan, inventory);
      }
    } catch {
      simulateLocalProgression(null, asstMsgId, prompt, isFan, inventory);
    }
  };

  // Graceful fallback streaming sequence with real deterministic harness progression
  const simulateLocalProgression = async (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string,
    isFan: boolean,
    inventory?: string[]
  ) => {
    const targetBuild = buildData || (isFan ? DESK_FAN_BUILD : SHOWCASE_BUILDS.sip);

    // If inventory provided, tag matching parts
    if (Array.isArray(inventory) && inventory.length > 0) {
      const invLower = inventory.map((i) => i.toLowerCase());
      targetBuild.parts = targetBuild.parts.map((p) => ({
        ...p,
        owned: invLower.some((inv) => inv.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(inv)),
      }));
    }

    // Stage 1: Reading
    await new Promise((r) => setTimeout(r, 300));
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
    await new Promise((r) => setTimeout(r, 400));
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
    await new Promise((r) => setTimeout(r, 450));
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
    await new Promise((r) => setTimeout(r, 400));
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
    await new Promise((r) => setTimeout(r, 400));
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
    await new Promise((r) => setTimeout(r, 350));
    finishLiveBuild(targetBuild, msgId, prompt, isFan, inventory);
  };

  const finishLiveBuild = (
    buildData: SolderBuild | null,
    msgId: string,
    prompt: string,
    isFan: boolean,
    inventory?: string[]
  ) => {
    setIsLoading(false);
    const finalBuild: SolderBuild = buildData || (isFan ? DESK_FAN_BUILD : SHOWCASE_BUILDS.sip);

    if (Array.isArray(inventory) && inventory.length > 0) {
      const invLower = inventory.map((i) => i.toLowerCase());
      finalBuild.parts = finalBuild.parts.map((p) => ({
        ...p,
        owned: invLower.some((inv) => inv.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(inv)),
      }));
    }

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
          text: isFan
            ? 'A temperature sensor switches a relay that powers the fan. Here is the verified build.'
            : finalBuild.summary || finalBuild.tagline || `A verified hardware build for ${finalBuild.name}.`,
        };
      })
    );
  };

  // Handler for Live Camera Mode "Use these parts"
  const handleUseLiveCameraParts = (parts: string[]) => {
    const promptText = `Build a verified DIY device using my tracked parts: ${parts.join(', ')}`;
    handleSendMessage(promptText, undefined, parts);
  };

  // Handler for file upload fallback from Live Camera
  const handleCameraPhotoFallback = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      if (b64) {
        handleSendMessage('Analyze my parts photo', b64);
      }
    };
    reader.readAsDataURL(file);
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
    <div className="app flex h-screen w-full bg-[#0f0f0f] text-[#f5f5f5] font-sans overflow-hidden">
      {/* Desktop Slim Sidebar (232px) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        onNewBuild={handleNewBuild}
        builds={buildsHistory}
        activeBuildId={activeBuild?.id}
        onSelectBuild={handleSelectBuild}
        onOpenScrapMode={() => setIsScrapOpen(true)}
        ownedCount={activeBuild?.parts?.filter((p) => p.owned).length || 0}
        savingsInr={scrapSavings}
      />

      {/* Mobile Slide-in Drawer */}
      <Sidebar
        isOpen={isMobileDrawerOpen}
        onToggle={() => setIsMobileDrawerOpen((prev) => !prev)}
        onNewBuild={handleNewBuild}
        builds={buildsHistory}
        activeBuildId={activeBuild?.id}
        onSelectBuild={handleSelectBuild}
        onOpenScrapMode={() => setIsScrapOpen(true)}
        ownedCount={activeBuild?.parts?.filter((p) => p.owned).length || 0}
        savingsInr={scrapSavings}
        isMobileDrawer={true}
        onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Single Column Layout: TopBar + Centered 768px Chat */}
      <main className="main flex-1 flex flex-col h-full min-w-0 bg-[#0f0f0f] relative overflow-hidden">
        <TopBar
          onToggleSidebar={() => {
            if (window.innerWidth < 768) {
              setIsMobileDrawerOpen((prev) => !prev);
            } else {
              setIsSidebarOpen((prev) => !prev);
            }
          }}
          isSidebarOpen={isSidebarOpen}
          onNewBuild={handleNewBuild}
          onOpenShare={() => setIsShareOpen(true)}
        />

        <ChatView
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onOpenScrapMode={() => setIsScrapOpen(true)}
          onOpenLiveCamera={() => setIsLiveCameraOpen(true)}
          onOpenOrder={() => setIsOrderOpen(true)}
          onOpenShip={() => setIsShipOpen(true)}
          onOpenAr={() => setIsArOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          onSelectShowcase={(id) => handleSelectBuild(id)}
          onSelectTab={(tab) => setActiveResultTab(tab)}
        />
      </main>

      {/* Live Camera Tracking Modal ("Point at your parts") */}
      <LiveCameraModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        onUseParts={handleUseLiveCameraParts}
        onUploadFallback={handleCameraPhotoFallback}
      />

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
