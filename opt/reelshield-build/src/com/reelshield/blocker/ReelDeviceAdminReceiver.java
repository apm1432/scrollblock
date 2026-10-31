package com.reelshield.blocker;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class ReelDeviceAdminReceiver extends DeviceAdminReceiver {

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        return "चेतावणी: ReelShield लॉक सुरू आहे! पासवर्ड टाकल्याशिवाय हे APK कुठूनही बंद किंवा Uninstall करता येणार नाही.";
    }

    @Override
    public void onEnabled(Context context, Intent intent) {
        Toast.makeText(
            context,
            "Device Admin सक्रिय! आता Home Screen किंवा कुठूनही APK Uninstall होऊ शकत नाही.",
            Toast.LENGTH_LONG
        ).show();
    }
}
