import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  FolderArchive,
  CloudLightning,
  CheckCircle2,
  ExternalLink,
  Github,
  Sparkles,
  ArrowRight,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateProjectZip, generateTestApkPackage } from '../utils/apkPackager';

export const ApkBuildCenter: React.FC = () => {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadApk = async () => {
    try {
      setDownloadingApk(true);
      const blob = await generateTestApkPackage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ReelShield-v1.0.0-testing.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess('ReelShield-v1.0.0-testing.apk यशस्वीरित्या डाऊनलोड झाले!');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingApk(false);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      const blob = await generateProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ReelShield-Android-Studio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess('ReelShield-Android-Studio-Project.zip यशस्वीरित्या डाऊनलोड झाले!');
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-6 h-6 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              APK डाऊनलोड आणि क्लाउड बिल्ड (Build & Download APK)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            थेट मोबाईल किंवा PC वर इन्स्टॉल करण्यासाठी तयार फाईल्स डाऊनलोड करा
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Direct Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test APK Package */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-600/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-amber-500/60 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                मोबाईल इन्स्टॉलेशनसाठी तयार
              </span>
              <span className="text-xs text-slate-400">Package: com.reelshield.blocker</span>
            </div>

            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>ReelShield Testing .APK</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              सर्व सुधारणांसह पॅक केलेली रेडीमेड <code className="text-amber-300 font-mono">.apk</code> फाईल. तुम्ही लगेच डाऊनलोड करून तुमच्या Android फोनमध्ये तपासू शकता.
            </p>

            <ul className="text-xs text-slate-400 space-y-1 pt-1">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inbuilt Master Recovery: <strong>Akshay@1181</strong></span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accessibility Reels / Shorts Blocker सक्रिय</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Device Admin Anti-Uninstall संरक्षण सक्षम</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadApk}
            disabled={downloadingApk}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingApk ? 'पॅकेज तयार होत आहे...' : 'ReelShield.apk डाऊनलोड करा (Testing APK)'}</span>
          </button>
        </div>

        {/* Full Android Studio Source ZIP */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 border border-indigo-600/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-indigo-500/60 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                Complete Project Archive
              </span>
              <span className="text-xs text-slate-400">Android Studio Ready</span>
            </div>

            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Android Studio Source Project (.zip)</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              सर्व फाईल्स, Gradle फाइल्स, XML रिसोर्सेस, Kotlin कोड आणि GitHub Actions वर्कफ्लो असलेली संपूर्ण ZIP फाईल.
            </p>

            <ul className="text-xs text-slate-400 space-y-1 pt-1">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>MainActivity.kt + Layout XML समाविष्ट</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AndroidManifest.xml व सर्व Services जोडल्या आहेत</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gradle 8.4 + Kotlin 1.9 कॉन्फिगरेशन</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <FolderArchive className="w-4 h-4" />
            <span>{downloadingZip ? 'झिप तयार होत आहे...' : 'संपूर्ण प्रोजेक्ट ZIP डाऊनलोड करा (Android Studio ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Build via GitHub Actions Guide */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center space-x-2">
          <CloudLightning className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm text-white">
            मोबाईलवरून विना-संगणक थेट Google/GitHub Cloud वरून APK कसे बनवायचे? (Cloud Builder Guide)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
              १
            </div>
            <div className="font-semibold text-white">ZIP फाईल अनझिप करा</div>
            <p className="text-slate-400 text-[11px]">
              वरील "संपूर्ण प्रोजेक्ट ZIP" डाऊनलोड करून तुमच्या GitHub रिपॉझिटरीमध्ये अपलोड करा.
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
              २
            </div>
            <div className="font-semibold text-white">Actions टॅब उघडा</div>
            <p className="text-slate-400 text-[11px]">
              GitHub वर गेल्यावर <span className="text-slate-200 font-mono">Actions</span> टॅबवर क्लिक करा.
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
              ३
            </div>
            <div className="font-semibold text-white">Run Workflow करा</div>
            <p className="text-slate-400 text-[11px]">
              "Build Ready-to-Install Android APK" निवडून Run Workflow वर क्लिक करा.
            </p>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
              ४
            </div>
            <div className="font-semibold text-white">तयार APK डाऊनलोड करा</div>
            <p className="text-slate-400 text-[11px]">
              २ मिनिटांत Artifacts मध्ये <span className="text-emerald-400 font-mono">ReelShield.apk</span> तयार होईल!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
