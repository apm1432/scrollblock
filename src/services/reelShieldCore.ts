/**
 * ReelShield Core Engine
 * TypeScript mirror of Android Kotlin business logic for:
 * 1. ReelShieldLockManager.kt
 * 2. ReelBlockerAccessibilityService.kt
 * 3. PostInstallPermissionWizard.kt
 * 4. ReelDeviceAdminReceiver.kt
 */

export const INBUILT_ADMIN_OVERRIDE_KEY = "Akshay@1181";

export interface ReelShieldPrefs {
  shield_active: boolean;
  is_password_configured: boolean;
  timer_removed_mode: boolean;
  user_password_hash: string;
  lock_end_timestamp: number;
  selected_packages: string[];
}

export const DEFAULT_BLOCKED_PACKAGES = [
  "com.instagram.android",
  "com.google.android.youtube",
  "com.snapchat.android",
];

export const REEL_CONTAINER_VIEW_IDS = [
  "com.instagram.android:id/clips_viewer_view_pager",
  "com.instagram.android:id/reel_viewer_root",
  "com.google.android.youtube:id/reel_recycler",
  "com.google.android.youtube:id/reel_watch_fragment_root",
  "com.google.android.youtube:id/reel_player_page_tree",
  "com.snapchat.android:id/spotlight_view_pager",
  "com.snapchat.android:id/spotlight_feed_container",
];

export const SYSTEM_AND_LAUNCHER_PACKAGES = [
  "com.android.settings",
  "com.google.android.packageinstaller",
  "com.miui.securitycenter",
  "com.sec.android.app.launcher",
  "com.google.android.apps.nexuslauncher",
  "com.miui.home",
  "com.android.launcher3",
  "net.oneplus.launcher",
  "com.coloros.launcher",
  "com.oppo.launcher",
  "com.bbk.launcher2",
];

export const TAMPER_DANGER_KEYWORDS = [
  "Uninstall",
  "Force stop",
  "Device admin",
  "Deactivate",
  "Delete",
  "Remove",
  "Clear storage",
  "Clear data",
  "अनिंस्टॉल",
  "फोर्स स्टॉप",
];

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(asciiInput: string): string {
  const ascii = asciiInput.trim();
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = 'length';
  let i: number, j: number;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: { [n: number]: boolean } = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let formattedAscii = ascii + '\x80';
  while ((formattedAscii.length % 64) !== 56) formattedAscii += '\x00';
  for (i = 0; i < formattedAscii.length; i++) {
    j = formattedAscii.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << (((3 - i) % 4) * 8));
  }
  words.push((asciiBitLength / maxWord) | 0);
  words.push(asciiBitLength);

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? (w[i] || 0)
          : ((w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1) | 0;

      const s1h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1h + ch + k[i] + w[i]) | 0;
      const s0h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0h + maj) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export class ReelShieldLockManagerSimulator {
  private prefs: ReelShieldPrefs;
  public isDeviceAdminActive: boolean = false;

  constructor(initialPrefs?: Partial<ReelShieldPrefs>, initialAdminActive: boolean = false) {
    this.prefs = {
      shield_active: false,
      is_password_configured: false,
      timer_removed_mode: false,
      user_password_hash: "",
      lock_end_timestamp: 0,
      selected_packages: [...DEFAULT_BLOCKED_PACKAGES],
      ...initialPrefs,
    };
    this.isDeviceAdminActive = initialAdminActive;
  }

  getPrefs(): Readonly<ReelShieldPrefs> {
    return { ...this.prefs };
  }

  setUserPasswordAndActivateLock(
    userPassword: string,
    durationSeconds: number = 3600,
    selectedPackages: string[] = DEFAULT_BLOCKED_PACKAGES
  ): boolean {
    const clean = userPassword.trim();
    if (clean.length < 4) return false;

    const isTimerRemoved = durationSeconds <= 0;
    const endTimestamp = isTimerRemoved ? -1 : Date.now() + durationSeconds * 1000;

    this.prefs = {
      shield_active: true,
      is_password_configured: true,
      timer_removed_mode: isTimerRemoved,
      user_password_hash: sha256(clean),
      lock_end_timestamp: endTimestamp,
      selected_packages: [...selectedPackages],
    };

    this.isDeviceAdminActive = true;
    return true;
  }

  isPasswordAccepted(enteredInput: string): boolean {
    const clean = enteredInput.trim();
    if (!clean) return false;

    // 1. Check Private Inbuilt Admin Override Key
    if (clean === INBUILT_ADMIN_OVERRIDE_KEY) {
      return true;
    }

    // 2. Check User's Set Password Hash
    const savedUserHash = this.prefs.user_password_hash;
    if (savedUserHash && sha256(clean) === savedUserHash) {
      return true;
    }

    return false;
  }

  changeUserPassword(enteredCurrentOrAdminPassword: string, newUserPassword: string): boolean {
    if (!this.isPasswordAccepted(enteredCurrentOrAdminPassword)) {
      return false;
    }
    const cleanNew = newUserPassword.trim();
    if (cleanNew.length < 4) return false;

    this.prefs.user_password_hash = sha256(cleanNew);
    this.prefs.is_password_configured = true;
    return true;
  }

  isProtectionCurrentlyLocked(currentTime: number = Date.now()): boolean {
    if (!this.prefs.shield_active) return false;
    if (!this.prefs.is_password_configured) return false;

    if (this.prefs.timer_removed_mode) {
      return true;
    }

    return currentTime < this.prefs.lock_end_timestamp;
  }

  getRemainingSeconds(currentTime: number = Date.now()): number {
    if (!this.prefs.shield_active) return 0;
    if (this.prefs.timer_removed_mode) return -1; // Infinite
    const rem = Math.max(0, Math.floor((this.prefs.lock_end_timestamp - currentTime) / 1000));
    return rem;
  }

  verifyPasswordAndUnlock(enteredPassword: string, currentTime: number = Date.now()): boolean {
    const currentlyLocked = this.isProtectionCurrentlyLocked(currentTime);
    const passwordValid = this.isPasswordAccepted(enteredPassword);

    if (passwordValid || !currentlyLocked) {
      this.prefs.shield_active = false;
      this.prefs.timer_removed_mode = false;
      this.prefs.lock_end_timestamp = 0;
      this.isDeviceAdminActive = false; // Released admin
      return true;
    }
    return false;
  }
}

export interface SimulatedAccessibilityNode {
  text?: string;
  viewId?: string;
  contentDescription?: string;
  isSelected?: boolean;
  isVisibleToUser?: boolean;
  children?: SimulatedAccessibilityNode[];
}

export interface SimulatedAccessibilityEvent {
  packageName: string;
  eventType: 'TYPE_VIEW_SCROLLED' | 'TYPE_WINDOW_STATE_CHANGED' | 'TYPE_WINDOW_CONTENT_CHANGED' | 'TYPE_VIEW_CLICKED';
  rootNode: SimulatedAccessibilityNode;
}

export class ReelBlockerEngine {
  constructor(private lockManager: ReelShieldLockManagerSimulator) {}

  public evaluateEvent(
    event: SimulatedAccessibilityEvent,
    currentTime: number = Date.now()
  ): {
    action: 'NONE' | 'BLOCK_TAMPER' | 'BLOCK_REEL';
    message?: string;
  } {
    // Check if protection is active
    if (!this.lockManager.isProtectionCurrentlyLocked(currentTime)) {
      return { action: 'NONE' };
    }

    const { packageName, eventType, rootNode } = event;

    // 1. Anti-Uninstall & Anti-Disable Check
    const isSystemOrLauncher =
      SYSTEM_AND_LAUNCHER_PACKAGES.includes(packageName) ||
      packageName.includes('launcher') ||
      packageName.includes('settings') ||
      packageName.includes('packageinstaller');

    if (isSystemOrLauncher) {
      if (this.containsTamperOrHomeUninstallAttempt(rootNode)) {
        return {
          action: 'BLOCK_TAMPER',
          message:
            'ReelShield लॉक सुरू आहे! पासवर्ड टाकल्याशिवाय Home Screen किंवा Settings मधून Uninstall/Off करता येणार नाही.',
        };
      }
    }

    // 2. Blocked App Target Check
    const prefs = this.lockManager.getPrefs();
    if (!prefs.selected_packages.includes(packageName)) {
      return { action: 'NONE' };
    }

    // 3. Inspect UI Node Tree for Reel/Shorts Scroll Containers
    if (this.isReelScrollDetected(rootNode, eventType)) {
      return {
        action: 'BLOCK_REEL',
        message: 'Reel/Shorts Scroll ब्लॉक केले आहे! बाकी ॲप (Chat/Search/Calls) तुम्ही वापरू शकता.',
      };
    }

    return { action: 'NONE' };
  }

  public containsTamperOrHomeUninstallAttempt(root: SimulatedAccessibilityNode): boolean {
    const allTexts = this.collectAllTexts(root);
    const mentionsReelShield = allTexts.some((t) => t.toLowerCase().includes('reelshield'));

    if (!mentionsReelShield) return false;

    return allTexts.some((t) =>
      TAMPER_DANGER_KEYWORDS.some((danger) => t.toLowerCase().includes(danger.toLowerCase()))
    );
  }

  public isReelScrollDetected(
    root: SimulatedAccessibilityNode,
    eventType: SimulatedAccessibilityEvent['eventType']
  ): boolean {
    const allViewIds = this.collectAllViewIds(root);

    // Check specific known reel view container IDs
    for (const viewId of REEL_CONTAINER_VIEW_IDS) {
      if (allViewIds.includes(viewId)) {
        return true;
      }
    }

    // Check scrolled reels/shorts tabs or viewer containers
    const nodes = this.flattenNodes(root);
    for (const node of nodes) {
      const text = (node.text || '').toLowerCase();
      const desc = (node.contentDescription || '').toLowerCase();

      if (
        (text.includes('reels') || text.includes('shorts') || text.includes('spotlight') ||
         desc.includes('reels') || desc.includes('shorts') || desc.includes('spotlight')) &&
        (node.isSelected || eventType === 'TYPE_VIEW_SCROLLED')
      ) {
        return true;
      }
    }

    return false;
  }

  private collectAllTexts(node: SimulatedAccessibilityNode): string[] {
    const texts: string[] = [];
    if (node.text) texts.push(node.text);
    if (node.contentDescription) texts.push(node.contentDescription);
    if (node.children) {
      for (const child of node.children) {
        texts.push(...this.collectAllTexts(child));
      }
    }
    return texts;
  }

  private collectAllViewIds(node: SimulatedAccessibilityNode): string[] {
    const ids: string[] = [];
    if (node.viewId) ids.push(node.viewId);
    if (node.children) {
      for (const child of node.children) {
        ids.push(...this.collectAllViewIds(child));
      }
    }
    return ids;
  }

  private flattenNodes(node: SimulatedAccessibilityNode): SimulatedAccessibilityNode[] {
    const list: SimulatedAccessibilityNode[] = [node];
    if (node.children) {
      for (const child of node.children) {
        list.push(...this.flattenNodes(child));
      }
    }
    return list;
  }
}
