import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  Download,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../data/androidProjectFiles';

export const CodeInspector: React.FC = () => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>(ANDROID_PROJECT_FILES[0].path);
  const [copied, setCopied] = useState(false);

  const selectedFile = ANDROID_PROJECT_FILES.find((f) => f.path === selectedFilePath) || ANDROID_PROJECT_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileCode className="w-6 h-6 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Android Studio सोर्स कोड आणि बग फिक्स (Source Code & Fixes)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            मूळ कोडमधील त्रुटी दूर करून परिपूर्ण Android APK स्ट्रक्चर तयार केले आहे
          </p>
        </div>
      </div>

      {/* Bug Fixes & Enhancement Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1">
          <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>बग फिक्स १: Default Lock Flag</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            मूळ कोडमध्ये <code className="text-rose-400 font-mono">prefs.getBoolean("shield_active", true)</code> होते. त्यामुळे ॲप पहिल्यांदा उघडताच लॉक व्हायचे! ते दुरुस्त करून <code className="text-emerald-400 font-mono">false</code> केले आहे.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1">
          <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>बग फिक्स २: Missing Manifest & UI</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            मूळ फाईलमध्ये <code className="text-amber-300 font-mono">MainActivity.kt</code> आणि <code className="text-amber-300 font-mono">AndroidManifest.xml</code> नव्हते, ज्यामुळे APK compile होऊ शकत नव्हते. आम्ही सर्व फाईल्स जोडल्या आहेत.
          </p>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1">
          <div className="font-semibold text-emerald-400 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>फीचर ३: Akshay@1181 Master Key</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            जर युजर पासवर्ड विसरला तर <code className="text-amber-400 font-mono">Akshay@1181</code> ने अनलॉक करण्याचा गुप्त बॅकएंड मार्ग कोडमध्ये सुरक्षितरीत्या समाविष्ट केला आहे.
          </p>
        </div>
      </div>

      {/* Code Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* File Tree / Selector */}
        <div className="lg:col-span-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-400 px-2 py-1 flex items-center space-x-1.5">
            <FolderTree className="w-4 h-4 text-indigo-400" />
            <span>प्रोजेक्ट फाईल्स ({ANDROID_PROJECT_FILES.length})</span>
          </div>

          <div className="space-y-1 max-h-[460px] overflow-y-auto">
            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = file.path === selectedFilePath;
              const fileName = file.path.split('/').pop() || file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all flex flex-col ${
                    isSelected
                      ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-200'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-medium text-[11px] truncate">{fileName}</span>
                  <span className="text-[9px] text-slate-500 font-sans truncate">{file.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor Box */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {/* File Tab Info Bar */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-indigo-300">{selectedFile.path}</span>
              <span className="text-slate-500 text-[10px]">({selectedFile.content.split('\n').length} lines)</span>
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'कॉपी झाले!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Description line */}
          <div className="px-4 py-1.5 bg-slate-900/40 text-[11px] text-slate-400 border-b border-slate-800/60">
            ℹ️ {selectedFile.description}
          </div>

          {/* Code Content */}
          <pre className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-[460px] overflow-y-auto selection:bg-indigo-900">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
