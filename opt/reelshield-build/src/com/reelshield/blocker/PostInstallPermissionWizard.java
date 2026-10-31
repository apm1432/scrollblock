package com.reelshield.blocker;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

public class PostInstallPermissionWizard {

    private final Activity activity;

    public PostInstallPermissionWizard(Activity activity) {
        this.activity = activity;
    }

    public void requestAllRequiredPermissionsSequentially() {
        DevicePolicyManager dpm = (DevicePolicyManager) activity.getSystemService(Context.DEVICE_POLICY_SERVICE);
        ComponentName adminComponent = new ComponentName(activity, ReelDeviceAdminReceiver.class);

        // 1. Device Admin
        if (dpm != null && !dpm.isAdminActive(adminComponent)) {
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
            intent.putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "ReelShield ला Home Screen वरून किंवा Settings मधून कोणीही डिलीट (Uninstall) करू नये म्हणून ही Admin परवानगी आवश्यक आहे."
            );
            activity.startActivity(intent);
            return;
        }

        // 2. Draw Overlays (System Alert Window)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(activity)) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + activity.getPackageName())
            );
            activity.startActivity(intent);
            return;
        }

        // 3. Ignore Battery Optimization
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) activity.getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(activity.getPackageName())) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + activity.getPackageName()));
                activity.startActivity(intent);
                return;
            }
        }

        // 4. Accessibility Service
        if (!isAccessibilityServiceEnabled()) {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            activity.startActivity(intent);
        }
    }

    private boolean isAccessibilityServiceEnabled() {
        ComponentName expected = new ComponentName(activity, ReelBlockerAccessibilityService.class);
        String enabledServices = Settings.Secure.getString(
            activity.getContentResolver(),
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (enabledServices == null) return false;
        return enabledServices.contains(expected.flattenToString());
    }
}
