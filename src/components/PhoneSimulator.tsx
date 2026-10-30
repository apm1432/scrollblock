import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Clock,
  Instagram,
  Youtube,
  Settings as SettingsIcon,
  Trash2,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Home,
  MessageCircle,
  Search,
  Sparkles,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ReelShieldLockManagerSimulator,
  ReelBlockerEngine,
  INBUILT_ADMIN_OVERRIDE_KEY,
  DEFAULT_BLOCKED_PACKAGES,
  sha256,
} from '../services/reelShieldCore';

interface PhoneSimulatorProps {
  onEventLog?: (log: { type: string; message: string; timestamp: string }) => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({ onEventLog }) => {
  // Simulator State
  const [activeApp, setActiveApp] = useState<'reelshield' | 'instagram' | 'youtube' | 'settings'>('reelshield');
  const [phoneTime, setPhoneTime] = useState('12:45');

  // ReelShield State
  const [lockManager] = useState(() => new ReelShieldLockManagerSimulator());
  const [blockerEngine] = useState(() => new ReelBlockerEngine(lockManager));
  const [isLocked, setIsLocked] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [isPermanent, setIsPermanent] = useState(false);

  // App Selection in ReelShield
  const [blockedApps, setBlockedApps] = useState<string[]>([...DEFAULT_BLOCKED_PACKAGES]);

  // Dialogs
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [showAdminRecoveryTip, setShowAdminRecoveryTip] = useState(false);

  // Form inputs
  const [inputPassword, setInputPassword] = useState('');
  const [inputDuration, setInputDuration] = useState('3600'); // 1h default
  const [unlockPassword, setUnlockPassword] = useState('');
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Active Toast in Phone
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Instagram simulated tab
  const [igTab, setIgTab] = useState<'feed' | 'messages' | 'reels'>('feed');
  // YouTube simulated tab
  const [ytTab, setYtTab] = useState<'home' | 'search' | 'shorts'>('home');

  // Permissions state
  const [perms, setPerms] = useState({
    deviceAdmin: false,
    accessibility: true,
    overlay: true,
    battery: true,
  });

  // Keep phone time synced
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhoneTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Timer countdown loop
  useEffect(() => {
    const timer = setInterval(() => {
      const locked = lockManager.isProtectionCurrentlyLocked();
      setIsLocked(locked);
      const rem = lockManager.getRemainingSeconds();
      setRemainingSecs(rem);
      const prefs = lockManager.getPrefs();
      setIsPermanent(prefs.timer_removed_mode);
      setPerms((p) => ({ ...p, deviceAdmin: lockManager.isDeviceAdminActive }));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockManager]);

  const showPhoneToast = (msg: string) => {
    setToastMessage(msg);
    if (onEventLog) {
      onEventLog({
        type: 'TOAST',
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Lock Activation
  const handleActivateLock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputPassword.length < 4) {
      showPhoneToast('पासवर्ड किमान ४ अक्षरांचा असावा!');
      return;
    }

    const duration = parseInt(inputDuration, 10);
    lockManager.setUserPasswordAndActivateLock(inputPassword, duration, blockedApps);

    setIsLocked(true);
    setShowSetupModal(false);
    setInputPassword('');
    showPhoneToast('🛡️ ReelShield सक्रिय झाले! रील्स आणि अनइन्स्टॉल लॉक आहे.');

    if (onEventLog) {
      onEventLog({
        type: 'LOCK_ACTIVATED',
        message: `ReelShield Locked (Duration: ${duration <= 0 ? 'Permanent' : duration + 's'})`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // Unlock attempt
  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const success = lockManager.verifyPasswordAndUnlock(unlockPassword);
    if (success) {
      setIsLocked(false);
      setShowUnlockModal(false);
      setUnlockPassword('');
      showPhoneToast('🔓 ReelShield यशस्वीरित्या अनलॉक झाले!');
      if (onEventLog) {
        onEventLog({
          type: 'UNLOCKED',
          message: 'Protection unlocked & Device Admin released.',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } else {
      showPhoneToast('❌ चुकीचा पासवर्ड! अनलॉक अयशस्वी.');
      if (onEventLog) {
        onEventLog({
          type: 'AUTH_FAILED',
          message: 'Failed unlock attempt with incorrect password.',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    }
  };

  // Change password attempt
  const handleChangePassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const success = lockManager.changeUserPassword(currPassword, newPassword);
    if (success) {
      setShowChangePassModal(false);
      setCurrPassword('');
      setNewPassword('');
      showPhoneToast('✅ पासवर्ड यशस्वीरित्या बदलला गेला!');
      if (onEventLog) {
        onEventLog({
          type: 'PASSWORD_CHANGED',
          message: 'User password hash updated in SharedPreferences.',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } else {
      showPhoneToast('❌ सध्याचा पासवर्ड चुकीचा आहे (किंवा नवीन पासवर्ड लहान आहे)!');
    }
  };

  // Instagram Reel Click
  const handleSelectIgTab = (tab: 'feed' | 'messages' | 'reels') => {
    if (tab === 'reels') {
      // Evaluate with Accessibility Engine
      const result = blockerEngine.evaluateEvent({
        packageName: 'com.instagram.android',
        eventType: 'TYPE_VIEW_SCROLLED',
        rootNode: {
          viewId: 'com.instagram.android:id/clips_viewer_view_pager',
          text: 'Reels',
          isSelected: true,
        },
      });

      if (result.action === 'BLOCK_REEL') {
        showPhoneToast(result.message || 'Reel Scroll ब्लॉक केले आहे!');
        setIgTab('feed'); // Force Back to Feed
        if (onEventLog) {
          onEventLog({
            type: 'ACCESSIBILITY_INTERCEPT',
            message: 'Instagram Reels blocked via clips_viewer_view_pager -> GLOBAL_ACTION_BACK',
            timestamp: new Date().toLocaleTimeString(),
          });
        }
        return;
      }
    }
    setIgTab(tab);
  };

  // YouTube Shorts Click
  const handleSelectYtTab = (tab: 'home' | 'search' | 'shorts') => {
    if (tab === 'shorts') {
      const result = blockerEngine.evaluateEvent({
        packageName: 'com.google.android.youtube',
        eventType: 'TYPE_VIEW_SCROLLED',
        rootNode: {
          viewId: 'com.google.android.youtube:id/reel_recycler',
          text: 'Shorts',
          isSelected: true,
        },
      });

      if (result.action === 'BLOCK_REEL') {
        showPhoneToast(result.message || 'Shorts Scroll ब्लॉक केले आहे!');
        setYtTab('home'); // Force Back to Home
        if (onEventLog) {
          onEventLog({
            type: 'ACCESSIBILITY_INTERCEPT',
            message: 'YouTube Shorts blocked via reel_recycler -> GLOBAL_ACTION_BACK',
            timestamp: new Date().toLocaleTimeString(),
          });
        }
        return;
      }
    }
    setYtTab(tab);
  };

  // Settings Uninstall Attempt
  const handleAttemptUninstall = () => {
    const result = blockerEngine.evaluateEvent({
      packageName: 'com.android.settings',
      eventType: 'TYPE_VIEW_CLICKED',
      rootNode: {
        children: [
          { text: 'ReelShield App Info' },
          { text: 'Uninstall' },
          { text: 'Force stop' },
        ],
      },
    });

    if (result.action === 'BLOCK_TAMPER') {
      showPhoneToast(result.message || 'Uninstall blocked!');
      setActiveApp('reelshield'); // Force back to Home / App
      if (onEventLog) {
        onEventLog({
          type: 'DEVICE_ADMIN_TAMPER_DEFENSE',
          message: 'Blocked Settings Force-Stop / Uninstall -> GLOBAL_ACTION_BACK + HOME',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } else {
      showPhoneToast('ReelShield अनइन्स्टॉल झाले (कारण लॉक निष्क्रिय होते).');
    }
  };

  const formatRemainingTime = () => {
    if (isPermanent) return 'कायमस्वरूपी (Permanent)';
    if (remainingSecs <= 0) return 'वेळ संपली आहे';
    const h = Math.floor(remainingSecs / 3600);
    const m = Math.floor((remainingSecs % 3600) / 60);
    const s = remainingSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {/* Device Frame */}
      <div className="relative w-full max-w-[375px] h-[720px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800 flex flex-col overflow-hidden select-none">
        {/* Dynamic Island / Speaker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center space-x-2 bg-black px-4 py-1 rounded-full border border-slate-800">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
          <div className="w-10 h-1.5 rounded-full bg-slate-900"></div>
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-5 pb-1 flex justify-between items-center text-xs font-semibold text-slate-300 z-20">
          <span>{phoneTime}</span>
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="font-mono">5G</span>
            <span>📶</span>
            <span>🔋 96%</span>
          </div>
        </div>

        {/* Screen Content Area */}
        <div className="relative flex-1 bg-slate-900 rounded-[36px] overflow-hidden flex flex-col text-white">
          {/* Active Toast Notification */}
          {toastMessage && (
            <div className="absolute top-12 left-3 right-3 z-50 animate-bounce bg-red-600/95 text-white text-xs font-medium px-3 py-2.5 rounded-xl shadow-lg border border-red-400 flex items-center space-x-2 backdrop-blur-md">
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="leading-tight">{toastMessage}</span>
            </div>
          )}

          {/* APP: REELSHIELD */}
          {activeApp === 'reelshield' && (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
              {/* App Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm tracking-wide">ReelShield</h2>
                    <p className="text-[10px] text-slate-400">Android Focus Blocker</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdminRecoveryTip(!showAdminRecoveryTip)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
                  title="Master Recovery Override"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] hidden sm:inline">Admin</span>
                </button>
              </div>

              {/* Master Recovery Tip Box */}
              {showAdminRecoveryTip && (
                <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-2.5 text-xs text-amber-200">
                  <div className="font-semibold flex items-center space-x-1 text-amber-300">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Inbuilt Master Recovery Key</span>
                  </div>
                  <p className="text-[11px] mt-1 text-amber-100/90 leading-tight">
                    जर युजर पासवर्ड विसरला तर <strong className="font-mono bg-amber-900/60 px-1 py-0.5 rounded text-white">{INBUILT_ADMIN_OVERRIDE_KEY}</strong> टाकून कधीही अनलॉक करता येते.
                  </p>
                </div>
              )}

              {/* Status Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isLocked
                    ? 'bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border-emerald-500/40'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-900/50 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isLocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {isLocked ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">सद्यस्थिती (Status)</div>
                      <div className="font-bold text-sm">
                        {isLocked ? (
                          <span className="text-emerald-400">🛡️ संरक्षित (LOCKED)</span>
                        ) : (
                          <span className="text-slate-300">⚠️ निष्क्रिय (UNLOCKED)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isLocked && (
                  <div className="mt-3 pt-3 border-t border-emerald-900/40 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>टायमर:</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-300">{formatRemainingTime()}</span>
                  </div>
                )}
              </div>

              {/* Main Action Button */}
              {isLocked ? (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <Unlock className="w-4 h-4" />
                  <span>पासवर्ड टाकून अनलॉक करा</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowSetupModal(true)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>ReelShield सुरू करा (Activate Lock)</span>
                </button>
              )}

              {/* Target Apps Checklist */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                <div className="text-xs font-semibold text-slate-300 mb-2">ब्लॉक करण्यासाठी ॲप्स:</div>
                <div className="space-y-2">
                  {[
                    { id: 'com.instagram.android', name: 'Instagram Reels', icon: Instagram, color: 'text-pink-400' },
                    { id: 'com.google.android.youtube', name: 'YouTube Shorts', icon: Youtube, color: 'text-red-400' },
                    { id: 'com.snapchat.android', name: 'Snapchat Spotlight', icon: Sparkles, color: 'text-amber-300' },
                  ].map((app) => {
                    const isChecked = blockedApps.includes(app.id);
                    return (
                      <label
                        key={app.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 cursor-pointer text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <app.icon className={`w-4 h-4 ${app.color}`} />
                          <span>{app.name}</span>
                        </div>
                        <input
                          type="checkbox"
                          disabled={isLocked}
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBlockedApps([...blockedApps, app.id]);
                            } else {
                              setBlockedApps(blockedApps.filter((id) => id !== app.id));
                            }
                          }}
                          className="rounded text-amber-500 focus:ring-amber-400"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
                  <span>Android परवानग्या (Wizard Status)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% OK</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Device Admin</span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Accessibility</span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Overlay Prompt</span>
                  </div>
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Battery Whitelist</span>
                  </div>
                </div>
              </div>

              {/* Change Password link */}
              <div className="text-center pt-1">
                <button
                  onClick={() => setShowChangePassModal(true)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-slate-600"
                >
                  पासवर्ड बदला (Change Password)
                </button>
              </div>
            </div>
          )}

          {/* APP: INSTAGRAM SIMULATOR */}
          {activeApp === 'instagram' && (
            <div className="flex-1 flex flex-col bg-slate-950 text-white">
              {/* Instagram Top Bar */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="font-serif italic font-bold text-lg bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                  Instagram
                </span>
                <div className="flex items-center space-x-3 text-slate-300">
                  <span className="text-sm">❤️</span>
                  <MessageCircle className="w-5 h-5" />
                </div>
              </div>

              {/* Instagram Body */}
              <div className="flex-1 overflow-y-auto p-3">
                {igTab === 'feed' && (
                  <div className="space-y-4">
                    {/* Story circles */}
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {['तुमची स्टोरी', 'Akshay', 'Rahul', 'Coding'].map((name, i) => (
                        <div key={i} className="flex flex-col items-center space-y-1 shrink-0">
                          <div className="w-12 h-12 rounded-full ring-2 ring-pink-500 p-0.5 bg-slate-900 flex items-center justify-center text-xs">
                            👤
                          </div>
                          <span className="text-[10px] text-slate-400">{name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Feed Post */}
                    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                      <div className="p-2.5 flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px]">
                          📱
                        </div>
                        <span className="text-xs font-semibold">Tech_Explorer</span>
                      </div>
                      <div className="h-44 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center text-xs text-slate-300 p-4 text-center">
                        सामान्य पोस्ट / फोटो / लेख (हे नेहमीप्रमाणे चालू राहील)
                      </div>
                      <div className="p-2.5 text-xs text-slate-300">
                        ❤️ 1,240 likes · 💬 84 comments
                      </div>
                    </div>
                  </div>
                )}

                {igTab === 'messages' && (
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-slate-400">Direct Messages</div>
                    {['मित्र १: Hi bro!', 'Office Group: Task complete', 'Family: Good morning!'].map((msg, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">💬</div>
                        <div>
                          <div className="font-medium text-slate-200">{msg.split(':')[0]}</div>
                          <div className="text-[11px] text-slate-400">{msg.split(':')[1]}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {igTab === 'reels' && (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                    <Play className="w-12 h-12 text-pink-500 mb-2 animate-pulse" />
                    <p className="text-xs text-slate-300">Reel Player</p>
                  </div>
                )}
              </div>

              {/* Instagram Bottom Nav */}
              <div className="border-t border-slate-800 p-2 flex justify-around items-center text-slate-400 text-xs">
                <button
                  onClick={() => handleSelectIgTab('feed')}
                  className={`flex flex-col items-center ${igTab === 'feed' ? 'text-white font-bold' : ''}`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-[9px]">Home</span>
                </button>
                <button
                  onClick={() => handleSelectIgTab('messages')}
                  className={`flex flex-col items-center ${igTab === 'messages' ? 'text-white font-bold' : ''}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[9px]">Chats</span>
                </button>
                <button
                  onClick={() => handleSelectIgTab('reels')}
                  className="flex flex-col items-center text-pink-400 hover:text-pink-300 active:scale-90 transition-transform"
                >
                  <div className="w-5 h-5 rounded border border-pink-500 flex items-center justify-center text-[10px]">
                    ▶
                  </div>
                  <span className="text-[9px] font-bold">Reels</span>
                </button>
              </div>
            </div>
          )}

          {/* APP: YOUTUBE SIMULATOR */}
          {activeApp === 'youtube' && (
            <div className="flex-1 flex flex-col bg-slate-950 text-white">
              {/* YouTube Top Bar */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-4 bg-red-600 rounded-sm flex items-center justify-center text-[9px] text-white font-bold">
                    ▶
                  </div>
                  <span className="font-bold text-sm tracking-tight">YouTube</span>
                </div>
                <Search className="w-4 h-4 text-slate-400" />
              </div>

              {/* YouTube Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {ytTab === 'home' && (
                  <>
                    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
                      <div className="h-36 bg-gradient-to-tr from-slate-800 to-indigo-950 flex items-center justify-center text-xs text-slate-300">
                        🎬 Long Tutorial Video (४५ मिनिटे)
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-semibold">Android Architecture & Security</div>
                        <div className="text-[10px] text-slate-400">DevChannel · 50K views</div>
                      </div>
                    </div>

                    {/* Notice */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/30 text-[11px] text-emerald-300">
                      ℹ️ मोठे व्हिडिओ, लेक्चर्स व गाणी नेहमीप्रमाणे सुरू राहतील. फक्त Shorts ब्लॉक होतील!
                    </div>
                  </>
                )}

                {ytTab === 'search' && (
                  <div className="text-xs text-slate-400 p-2">सर्च करून मोठे व्हिडिओ प्ले करता येतील.</div>
                )}
              </div>

              {/* YouTube Bottom Nav */}
              <div className="border-t border-slate-800 p-2 flex justify-around items-center text-slate-400 text-xs">
                <button
                  onClick={() => handleSelectYtTab('home')}
                  className={`flex flex-col items-center ${ytTab === 'home' ? 'text-white font-bold' : ''}`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-[9px]">Home</span>
                </button>
                <button
                  onClick={() => handleSelectYtTab('shorts')}
                  className="flex flex-col items-center text-red-500 hover:text-red-400 active:scale-90 transition-transform"
                >
                  <div className="w-5 h-5 rounded border border-red-500 flex items-center justify-center text-[10px]">
                    ⚡
                  </div>
                  <span className="text-[9px] font-bold">Shorts</span>
                </button>
                <button
                  onClick={() => handleSelectYtTab('search')}
                  className={`flex flex-col items-center ${ytTab === 'search' ? 'text-white' : ''}`}
                >
                  <Search className="w-4 h-4" />
                  <span className="text-[9px]">Search</span>
                </button>
              </div>
            </div>
          )}

          {/* APP: ANDROID SETTINGS SIMULATOR */}
          {activeApp === 'settings' && (
            <div className="flex-1 flex flex-col bg-slate-900 text-white p-4">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <SettingsIcon className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-sm">App info - ReelShield</span>
              </div>

              <div className="flex-1 py-4 space-y-4">
                <div className="flex items-center space-x-3 bg-slate-800/60 p-3 rounded-xl">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">ReelShield</div>
                    <div className="text-xs text-slate-400">version 1.0.0 (debug)</div>
                    <div className="text-[10px] text-emerald-400">Device Admin: Active</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleAttemptUninstall}
                    className="w-full py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Uninstall (अनइन्स्टॉल करा)</span>
                  </button>

                  <button
                    onClick={handleAttemptUninstall}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
                  >
                    <span>Force stop (फोर्स स्टॉप)</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <strong className="text-slate-200">Anti-Tamper टेस्ट:</strong> जर वरील बटनवर क्लिक केले आणि ReelShield Locked असेल, तर Device Admin आणि Accessibility लगेच Home स्क्रीनवर फेकते आणि चेतावणी दाखवते!
                </div>
              </div>
            </div>
          )}

          {/* Setup Modal */}
          {showSetupModal && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-emerald-400">ReelShield लॉक पासवर्ड सेट करा</span>
                  <button onClick={() => setShowSetupModal(false)} className="text-slate-400 text-xs">✕</button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">तुमचा सिक्रेट पासवर्ड (किमान ४ अक्षरे):</label>
                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={inputPassword}
                      onChange={(e) => setInputPassword(e.target.value)}
                      placeholder="उदा. 1234 किंवा MyPass"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-2 top-2 text-slate-400 text-xs"
                    >
                      {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">लॉक कालावधी (Duration):</label>
                  <select
                    value={inputDuration}
                    onChange={(e) => setInputDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="60">१ मिनिट (Quick Demo Test)</option>
                    <option value="3600">१ तास (1 Hour)</option>
                    <option value="14400">४ तास (4 Hours)</option>
                    <option value="86400">२४ तास (24 Hours)</option>
                    <option value="0">टायमर काढून टाका (Permanent Mode)</option>
                  </select>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    रद्द करा
                  </button>
                  <button
                    onClick={handleActivateLock}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow"
                  >
                    सुरू करा
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unlock Modal */}
          {showUnlockModal && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-amber-400">ReelShield अनलॉक करा</span>
                  <button onClick={() => setShowUnlockModal(false)} className="text-slate-400 text-xs">✕</button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">पासवर्ड टाका (किंवा Admin Key):</label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="पासवर्ड टाका..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <div className="text-[9px] text-slate-500 mt-1">
                    टीप: जर पासवर्ड विसरला तर <span className="text-amber-400 font-mono">Akshay@1181</span> ने अनलॉक करता येते.
                  </div>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    रद्द करा
                  </button>
                  <button
                    onClick={handleUnlock}
                    className="flex-1 py-1.5 rounded-lg bg-amber-600 text-white font-semibold text-xs shadow"
                  >
                    अनलॉक करा
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Password Modal */}
          {showChangePassModal && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-200">पासवर्ड बदला</span>
                  <button onClick={() => setShowChangePassModal(false)} className="text-slate-400 text-xs">✕</button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">सध्याचा पासवर्ड (किंवा Admin Override):</label>
                  <input
                    type="password"
                    value={currPassword}
                    onChange={(e) => setCurrPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">नवीन पासवर्ड (किमान ४ अक्षरे):</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => setShowChangePassModal(false)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    रद्द करा
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow"
                  >
                    सेव्ह करा
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Phone Bottom Navigation Bar (Android Switcher) */}
        <div className="pt-2.5 pb-1 flex justify-around items-center border-t border-slate-800/80 bg-slate-950 z-20">
          <button
            onClick={() => setActiveApp('reelshield')}
            className={`px-3 py-1 rounded-xl text-xs flex items-center space-x-1.5 transition-all ${
              activeApp === 'reelshield'
                ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[10px]">ReelShield</span>
          </button>

          <button
            onClick={() => setActiveApp('instagram')}
            className={`px-2.5 py-1 rounded-xl text-xs flex items-center space-x-1 transition-all ${
              activeApp === 'instagram'
                ? 'bg-pink-500/20 text-pink-400 font-bold border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span className="text-[10px]">Insta</span>
          </button>

          <button
            onClick={() => setActiveApp('youtube')}
            className={`px-2.5 py-1 rounded-xl text-xs flex items-center space-x-1 transition-all ${
              activeApp === 'youtube'
                ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span className="text-[10px]">YT</span>
          </button>

          <button
            onClick={() => setActiveApp('settings')}
            className={`px-2 py-1 rounded-xl text-xs flex items-center space-x-1 transition-all ${
              activeApp === 'settings'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Android Settings (Test Anti-Uninstall)"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
