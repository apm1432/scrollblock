import React, { useState } from 'react';
import {
  Shield,
  Smartphone,
  CheckCircle2,
  FileCode,
  Download,
  Terminal,
  KeyRound,
  Sparkles,
  ExternalLink,
  Info,
  Bug,
  Lock,
  Layers
} from 'lucide-react';
import { PhoneSimulator } from './components/PhoneSimulator';
import { TestSuitePanel } from './components/TestSuitePanel';
import { CodeInspector } from './components/CodeInspector';
import { ApkBuildCenter } from './components/ApkBuildCenter';
import { EventLogPanel, LogEntry } from './components/EventLogPanel';
import { INBUILT_ADMIN_OVERRIDE_KEY } from './services/reelShieldCore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'tests' | 'build' | 'code'>('simulator');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      type: 'INIT',
      message: 'ReelShield Android OS Accessibility & Device Admin Engine Initialized.',
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: 'SECURITY',
      message: `Master Recovery Key active: "${INBUILT_ADMIN_OVERRIDE_KEY}" (Hidden Admin Override)`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const handleAddLog = (newLog: LogEntry) => {
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  ReelShield
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android APK Studio
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Instagram Reels &amp; YouTube Shorts Blocker with Anti-Uninstall Protection
              </p>
            </div>
          </div>

          {/* Quick Badges / Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Master Key:</span>
              <span className="font-mono font-bold text-amber-300">{INBUILT_ADMIN_OVERRIDE_KEY}</span>
            </div>

            <button
              onClick={() => setActiveTab('build')}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">APK डाऊनलोड करा</span>
              <span className="sm:hidden">APK</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex space-x-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'simulator', label: '📱 फोन सिम्युलेटर (Live Test)', icon: Smartphone },
            { id: 'tests', label: '🧪 १५ स्वयंचलित चाचण्या (Test Suite)', icon: CheckCircle2 },
            { id: 'build', label: '⚡ APK डाऊनलोड व क्लाउड बिल्ड', icon: Download },
            { id: 'code', label: '💻 Android Studio कोड व फिक्स', icon: FileCode },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 text-xs font-semibold flex items-center space-x-2 border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* TAB 1: INTERACTIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Virtual Phone Simulator */}
            <div className="lg:col-span-5 flex justify-center">
              <PhoneSimulator onEventLog={handleAddLog} />
            </div>

            {/* Right: Interactive Instructions & Live Event Log */}
            <div className="lg:col-span-7 space-y-5">
              {/* How to Test Guide */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>कशी टेस्ट करायची? (Live Interactive Testing Guide)</span>
                  </h3>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                    Active Simulator
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-semibold text-pink-400">१. Instagram Reels टेस्ट</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      सिम्युलेटरमध्ये <strong>ReelShield लॉक</strong> सुरू करा. नंतर खालील <span className="text-pink-400 font-semibold">Insta</span> बटण दाबून "Reels" वर क्लिक करा. ऍक्सेसिबिलिटी सर्विस लगेच बॅक करेल!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-semibold text-red-400">२. YouTube Shorts टेस्ट</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      खालील <span className="text-red-400 font-semibold">YT</span> वर क्लिक करा. सामान्य व्हिडिओ चालू राहतील, पण "Shorts" वर क्लिक करताच लगेच होम स्क्रीनवर नेऊन चेतावणी दिली जाईल.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-semibold text-amber-300">३. Anti-Uninstall टेस्ट</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      खालील <span className="text-slate-300 font-semibold">Settings ⚙️</span> आयकॉनवर क्लिक करा आणि "Uninstall" किंवा "Force stop" दाबून पहा. Device Admin लगेच ते ब्लॉक करेल!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="font-semibold text-emerald-400">४. Emergency Admin Override</div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      पासवर्ड काहीही असला किंवा विसरला तरी अनलॉक करताना <code className="text-amber-400 font-mono font-bold">{INBUILT_ADMIN_OVERRIDE_KEY}</code> टाकल्यास ॲप तात्काळ अनलॉक होते!
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Android OS Event Log */}
              <EventLogPanel logs={logs} onClear={handleClearLogs} />

              {/* Architecture Summary Card */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">ReelShield Android Architecture:</div>
                  <div className="text-[11px] text-slate-400">
                    ReelShieldLockManager.kt + ReelBlockerAccessibilityService.kt + ReelDeviceAdminReceiver.kt
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('tests')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
                >
                  <span>चाचण्या पहा</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUTOMATED TEST SUITE */}
        {activeTab === 'tests' && <TestSuitePanel />}

        {/* TAB 3: APK BUILD CENTER */}
        {activeTab === 'build' && <ApkBuildCenter />}

        {/* TAB 4: CODE INSPECTOR */}
        {activeTab === 'code' && <CodeInspector />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>ReelShield Android Blocker v1.0.0 · Package: com.reelshield.blocker</div>
          <div className="flex items-center space-x-4">
            <span className="text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>१५/१५ चाचण्या उत्तीर्ण</span>
            </span>
            <span>Master Recovery: {INBUILT_ADMIN_OVERRIDE_KEY}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
