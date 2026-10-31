package com.reelshield.blocker;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.SharedPreferences;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ReelBlockerAccessibilityService extends AccessibilityService {

    private final Set<String> defaultBlockedPackages = new HashSet<>(Arrays.asList(
        "com.instagram.android", "com.google.android.youtube", "com.snapchat.android"
    ));

    private final List<String> reelContainerViewIds = Arrays.asList(
        "com.instagram.android:id/clips_viewer_view_pager",
        "com.instagram.android:id/reel_viewer_root",
        "com.google.android.youtube:id/reel_recycler",
        "com.google.android.youtube:id/reel_watch_fragment_root",
        "com.google.android.youtube:id/reel_player_page_tree",
        "com.snapchat.android:id/spotlight_view_pager",
        "com.snapchat.android:id/spotlight_feed_container"
    );

    private final Set<String> systemAndLauncherPackages = new HashSet<>(Arrays.asList(
        "com.android.settings", "com.google.android.packageinstaller", "com.android.packageinstaller",
        "com.miui.securitycenter", "com.sec.android.app.launcher", "com.google.android.apps.nexuslauncher",
        "com.miui.home", "com.android.launcher3", "net.oneplus.launcher",
        "com.coloros.launcher", "com.oppo.launcher", "com.bbk.launcher2"
    ));

    private final List<String> dangerKeywords = Arrays.asList(
        "Uninstall", "Force stop", "Device admin", "Deactivate", "Delete", "Remove", "Clear storage", "Clear data", "अनिंस्टॉल"
    );

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;
        ReelShieldLockManager lockManager = new ReelShieldLockManager(this);
        if (!lockManager.isProtectionCurrentlyLocked()) return;

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String packageName = pkgSeq.toString();

        if (systemAndLauncherPackages.contains(packageName) || packageName.contains("launcher") || packageName.contains("settings")) {
            AccessibilityNodeInfo rootNode = getRootInActiveWindow();
            if (rootNode != null && containsTamperOrHomeUninstallAttempt(rootNode)) {
                performGlobalAction(GLOBAL_ACTION_BACK);
                performGlobalAction(GLOBAL_ACTION_HOME);
                Toast.makeText(this, "ReelShield लॉक सुरू आहे! पासवर्ड टाकल्याशिवाय Uninstall/Off करता येणार नाही.", Toast.LENGTH_LONG).show();
                return;
            }
        }

        SharedPreferences prefs = getSharedPreferences("reel_shield_prefs", Context.MODE_PRIVATE);
        Set<String> activePackages = prefs.getStringSet("selected_packages", defaultBlockedPackages);
        if (activePackages == null || !activePackages.contains(packageName)) return;

        AccessibilityNodeInfo rootNode = getRootInActiveWindow();
        if (rootNode != null && isReelScrollDetected(rootNode, event)) {
            performGlobalAction(GLOBAL_ACTION_BACK);
            Toast.makeText(this, "Reel/Shorts Scroll ब्लॉक केले आहे! बाकी ॲप तुम्ही वापरू शकता.", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean isReelScrollDetected(AccessibilityNodeInfo root, AccessibilityEvent event) {
        for (String viewId : reelContainerViewIds) {
            List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByViewId(viewId);
            if (matches != null && !matches.isEmpty()) return true;
        }

        if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
            List<AccessibilityNodeInfo> reelNodes = root.findAccessibilityNodeInfosByText("Reels");
            if (reelNodes != null) {
                for (AccessibilityNodeInfo node : reelNodes) {
                    if (node.isSelected() && node.isVisibleToUser()) return true;
                }
            }
            List<AccessibilityNodeInfo> shortsNodes = root.findAccessibilityNodeInfosByText("Shorts");
            if (shortsNodes != null) {
                for (AccessibilityNodeInfo node : shortsNodes) {
                    if (node.isSelected() && node.isVisibleToUser()) return true;
                }
            }
        }
        return false;
    }

    private boolean containsTamperOrHomeUninstallAttempt(AccessibilityNodeInfo root) {
        List<AccessibilityNodeInfo> mentions = root.findAccessibilityNodeInfosByText("ReelShield");
        if (mentions == null || mentions.isEmpty()) return false;

        for (String word : dangerKeywords) {
            List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(word);
            if (nodes != null && !nodes.isEmpty()) return true;
        }
        return false;
    }

    @Override
    public void onInterrupt() {}
}
