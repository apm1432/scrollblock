package com.reelshield.blocker;

import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import java.security.MessageDigest;
import java.util.Set;
import java.util.HashSet;

public class ReelShieldLockManager {

    // Private Inbuilt Admin Override (Master key for Akshay)
    public static final String INBUILT_ADMIN_OVERRIDE_KEY = "Akshay@1181";

    private final Context context;
    private final SharedPreferences prefs;

    public ReelShieldLockManager(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences("reel_shield_prefs", Context.MODE_PRIVATE);
    }

    public void setUserPasswordAndActivateLock(String userPassword, long durationSeconds, Set<String> selectedPackages) {
        boolean isTimerRemoved = durationSeconds <= 0L;
        long endTimestamp = isTimerRemoved ? -1L : System.currentTimeMillis() + (durationSeconds * 1000L);

        prefs.edit()
            .putBoolean("shield_active", true)
            .putBoolean("is_password_configured", true)
            .putBoolean("timer_removed_mode", isTimerRemoved)
            .putString("user_password_hash", sha256(userPassword.trim()))
            .putLong("lock_end_timestamp", endTimestamp)
            .putStringSet("selected_packages", selectedPackages)
            .apply();
    }

    public boolean isPasswordAccepted(String enteredInput) {
        if (enteredInput == null) return false;
        String clean = enteredInput.trim();
        if (clean.isEmpty()) return false;

        // 1. Check Private Inbuilt Admin Override Key
        if (clean.equals(INBUILT_ADMIN_OVERRIDE_KEY)) {
            return true;
        }

        // 2. Check User's Set Password Hash
        String savedUserHash = prefs.getString("user_password_hash", "");
        return savedUserHash != null && !savedUserHash.isEmpty() && sha256(clean).equals(savedUserHash);
    }

    public boolean changeUserPassword(String enteredCurrentOrAdminPassword, String newUserPassword) {
        if (!isPasswordAccepted(enteredCurrentOrAdminPassword)) {
            return false;
        }
        if (newUserPassword == null) return false;
        String cleanNew = newUserPassword.trim();
        if (cleanNew.length() < 4) return false;

        prefs.edit()
            .putString("user_password_hash", sha256(cleanNew))
            .putBoolean("is_password_configured", true)
            .apply();
        return true;
    }

    public boolean isProtectionCurrentlyLocked() {
        boolean active = prefs.getBoolean("shield_active", false);
        boolean isConfigured = prefs.getBoolean("is_password_configured", false);
        if (!active || !isConfigured) return false;

        boolean isTimerRemoved = prefs.getBoolean("timer_removed_mode", false);
        if (isTimerRemoved) {
            return true;
        }

        long lockEnd = prefs.getLong("lock_end_timestamp", 0L);
        return System.currentTimeMillis() < lockEnd;
    }

    public boolean verifyPasswordAndUnlock(String enteredPassword) {
        if (isPasswordAccepted(enteredPassword) || !isProtectionCurrentlyLocked()) {
            prefs.edit()
                .putBoolean("shield_active", false)
                .putBoolean("timer_removed_mode", false)
                .putLong("lock_end_timestamp", 0L)
                .apply();

            DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            if (dpm != null) {
                ComponentName adminComponent = new ComponentName(context, ReelDeviceAdminReceiver.class);
                if (dpm.isAdminActive(adminComponent)) {
                    dpm.removeActiveAdmin(adminComponent);
                }
            }
            return true;
        }
        return false;
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}
