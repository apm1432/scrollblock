/**
 * Complete Android Studio Project Source Files for ReelShield
 * Package: com.reelshield.blocker
 */

export interface AndroidFile {
  path: string;
  category: 'kotlin' | 'manifest' | 'res' | 'gradle' | 'workflow';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    path: "app/src/main/java/com/reelshield/blocker/MainActivity.kt",
    category: "kotlin",
    description: "ReelShield मुख्य स्क्रीन (Password setup, timer, app blocklist, unlock dialog)",
    content: `package com.reelshield.blocker

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var lockManager: ReelShieldLockManager
    private lateinit var statusText: TextView
    private lateinit var timerText: TextView
    private lateinit var btnToggleShield: Button
    private lateinit var btnChangePassword: Button
    private lateinit var btnCheckPermissions: Button
    private lateinit var cbInstagram: CheckBox
    private lateinit var cbYoutube: CheckBox
    private lateinit var cbSnapchat: CheckBox

    private var countDownTimer: CountDownTimer? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        lockManager = ReelShieldLockManager(this)

        statusText = findViewById(R.id.tvShieldStatus)
        timerText = findViewById(R.id.tvTimerRemaining)
        btnToggleShield = findViewById(R.id.btnToggleShield)
        btnChangePassword = findViewById(R.id.btnChangePassword)
        btnCheckPermissions = findViewById(R.id.btnCheckPermissions)

        cbInstagram = findViewById(R.id.cbInstagram)
        cbYoutube = findViewById(R.id.cbYoutube)
        cbSnapchat = findViewById(R.id.cbSnapchat)

        updateUiState()

        btnToggleShield.setOnClickListener {
            if (lockManager.isProtectionCurrentlyLocked()) {
                showUnlockDialog()
            } else {
                showActivateLockDialog()
            }
        }

        btnChangePassword.setOnClickListener {
            showChangePasswordDialog()
        }

        btnCheckPermissions.setOnClickListener {
            PostInstallPermissionWizard(this).requestAllRequiredPermissionsSequentially()
        }
    }

    override fun onResume() {
        super.onResume()
        updateUiState()
    }

    private fun updateUiState() {
        val isLocked = lockManager.isProtectionCurrentlyLocked()
        if (isLocked) {
            statusText.text = "🛡️ ReelShield सक्रिय (LOCKED)"
            statusText.setTextColor(getColor(R.color.shield_active_color))
            btnToggleShield.text = "🔓 पासवर्ड टाकून अनलॉक करा"
            startCountDown()
        } else {
            statusText.text = "⚠️ ReelShield निष्क्रिय (UNLOCKED)"
            statusText.setTextColor(getColor(R.color.shield_inactive_color))
            btnToggleShield.text = "🔒 ReelShield सुरू करा (Lock)"
            timerText.text = "लॉक बंद आहे."
            countDownTimer?.cancel()
        }
    }

    private fun startCountDown() {
        countDownTimer?.cancel()
        val prefs = getSharedPreferences("reel_shield_prefs", Context.MODE_PRIVATE)
        val isPermanent = prefs.getBoolean("timer_removed_mode", false)
        if (isPermanent) {
            timerText.text = "कधीही संपणार नाही (Permanent Mode)"
            return
        }

        val endTimestamp = prefs.getLong("lock_end_timestamp", 0L)
        val remainingMillis = endTimestamp - System.currentTimeMillis()

        if (remainingMillis <= 0) {
            timerText.text = "टायमर संपला आहे."
            return
        }

        countDownTimer = object : CountDownTimer(remainingMillis, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val hours = millisUntilFinished / (1000 * 60 * 60)
                val minutes = (millisUntilFinished % (1000 * 60 * 60)) / (1000 * 60)
                val seconds = (millisUntilFinished % (1000 * 60)) / 1000
                timerText.text = String.format("उर्वरित वेळ: %02d:%02d:%02d", hours, minutes, seconds)
            }

            override fun onFinish() {
                updateUiState()
            }
        }.start()
    }

    private fun showActivateLockDialog() {
        val view = layoutInflater.inflate(R.layout.dialog_activate_lock, null)
        val etPassword = view.findViewById<EditText>(R.id.etPassword)
        val spDuration = view.findViewById<Spinner>(R.id.spDuration)

        val durations = arrayOf("१ तास (1 Hour)", "४ तास (4 Hours)", "८ तास (8 Hours)", "२४ तास (24 Hours)", "टायमर काढून टाका (Permanent)")
        spDuration.adapter = ArrayAdapter(this, android.R.layout.simple_spinner_dropdown_item, durations)

        AlertDialog.Builder(this)
            .setTitle("ReelShield पासवर्ड व टायमर निवडा")
            .setView(view)
            .setPositiveButton("सुरू करा") { _, _ ->
                val pass = etPassword.text.toString().trim()
                if (pass.length < 4) {
                    Toast.makeText(this, "पासवर्ड किमान ४ अक्षरांचा असावा!", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                val selectedPackages = mutableSetOf<String>()
                if (cbInstagram.isChecked) selectedPackages.add("com.instagram.android")
                if (cbYoutube.isChecked) selectedPackages.add("com.google.android.youtube")
                if (cbSnapchat.isChecked) selectedPackages.add("com.snapchat.android")

                val seconds = when (spDuration.selectedItemPosition) {
                    0 -> 3600L
                    1 -> 14400L
                    2 -> 28800L
                    3 -> 86400L
                    else -> 0L // Permanent mode
                }

                lockManager.setUserPasswordAndActivateLock(pass, seconds, selectedPackages)
                Toast.makeText(this, "ReelShield सक्रिय झाले!", Toast.LENGTH_LONG).show()
                updateUiState()
            }
            .setNegativeButton("रद्द करा", null)
            .show()
    }

    private fun showUnlockDialog() {
        val input = EditText(this).apply {
            hint = "तुमचा पासवर्ड टाका (किंवा Admin Override)"
            transformationMethod = android.text.method.PasswordTransformationMethod.getInstance()
        }

        AlertDialog.Builder(this)
            .setTitle("ReelShield अनलॉक करा")
            .setMessage("लॉक काढण्यासाठी पासवर्ड टाका:")
            .setView(input)
            .setPositiveButton("अनलॉक") { _, _ ->
                val pass = input.text.toString()
                if (lockManager.verifyPasswordAndUnlock(pass)) {
                    Toast.makeText(this, "ReelShield यशस्वीरित्या अनलॉक झाले!", Toast.LENGTH_SHORT).show()
                    updateUiState()
                } else {
                    Toast.makeText(this, "चुकीचा पासवर्ड! अनलॉक अयशस्वी.", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("रद्द करा", null)
            .show()
    }

    private fun showChangePasswordDialog() {
        val view = layoutInflater.inflate(R.layout.dialog_change_password, null)
        val etCurrentPass = view.findViewById<EditText>(R.id.etCurrentPassword)
        val etNewPass = view.findViewById<EditText>(R.id.etNewPassword)

        AlertDialog.Builder(this)
            .setTitle("पासवर्ड बदला")
            .setView(view)
            .setPositiveButton("बदला") { _, _ ->
                val curr = etCurrentPass.text.toString()
                val newP = etNewPass.text.toString()
                if (lockManager.changeUserPassword(curr, newP)) {
                    Toast.makeText(this, "नवीन पासवर्ड सेव्ह झाला!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this, "सध्याचा पासवर्ड चुकीचा आहे!", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("रद्द करा", null)
            .show()
    }
}
`
  },
  {
    path: "app/src/main/java/com/reelshield/blocker/ReelShieldLockManager.kt",
    category: "kotlin",
    description: "पासवर्ड मॅनेजर, SHA-256 हॅशिंग, आणि गुप्त Master Admin Key (Akshay@1181)",
    content: `package com.reelshield.blocker

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import java.security.MessageDigest

/**
 * ReelShieldLockManager
 * - Stores user password as SHA-256 hash.
 * - Inbuilt private Master Override ("Akshay@1181") for safe recovery.
 * - Handles timed lock or infinite (timer-removed) lock.
 */
class ReelShieldLockManager(private val context: Context) {

    companion object {
        // Private Inbuilt Admin Override (Master recovery key for Akshay)
        private const val INBUILT_ADMIN_OVERRIDE_KEY = "Akshay@1181"
    }

    private val prefs = context.getSharedPreferences("reel_shield_prefs", Context.MODE_PRIVATE)

    fun setUserPasswordAndActivateLock(
        userPassword: String,
        durationSeconds: Long = 3600L,
        selectedPackages: Set<String>
    ) {
        val isTimerRemoved = durationSeconds <= 0L
        val endTimestamp = if (isTimerRemoved) -1L else System.currentTimeMillis() + (durationSeconds * 1000L)

        prefs.edit()
            .putBoolean("shield_active", true)
            .putBoolean("is_password_configured", true)
            .putBoolean("timer_removed_mode", isTimerRemoved)
            .putString("user_password_hash", sha256(userPassword.trim()))
            .putLong("lock_end_timestamp", endTimestamp)
            .putStringSet("selected_packages", selectedPackages)
            .apply()
    }

    /**
     * Accepts either User's password OR Master Recovery Key ("Akshay@1181").
     */
    fun isPasswordAccepted(enteredInput: String): Boolean {
        val clean = enteredInput.trim()
        if (clean.isEmpty()) return false

        // 1. Check Private Inbuilt Admin Override Key
        if (clean == INBUILT_ADMIN_OVERRIDE_KEY) return true

        // 2. Check User's Set Password Hash
        val savedUserHash = prefs.getString("user_password_hash", "") ?: ""
        return savedUserHash.isNotEmpty() && sha256(clean) == savedUserHash
    }

    fun changeUserPassword(enteredCurrentOrAdminPassword: String, newUserPassword: String): Boolean {
        if (!isPasswordAccepted(enteredCurrentOrAdminPassword)) {
            return false
        }
        val cleanNew = newUserPassword.trim()
        if (cleanNew.length < 4) return false

        prefs.edit()
            .putString("user_password_hash", sha256(cleanNew))
            .putBoolean("is_password_configured", true)
            .apply()
        return true
    }

    fun isProtectionCurrentlyLocked(): Boolean {
        // Fix: Default to false if not configured yet!
        val active = prefs.getBoolean("shield_active", false)
        val isConfigured = prefs.getBoolean("is_password_configured", false)
        if (!active || !isConfigured) return false

        val isTimerRemoved = prefs.getBoolean("timer_removed_mode", false)
        if (isTimerRemoved) {
            return true
        }

        val lockEnd = prefs.getLong("lock_end_timestamp", 0L)
        return System.currentTimeMillis() < lockEnd
    }

    fun verifyPasswordAndUnlock(enteredPassword: String): Boolean {
        if (isPasswordAccepted(enteredPassword) || !isProtectionCurrentlyLocked()) {
            prefs.edit()
                .putBoolean("shield_active", false)
                .putBoolean("timer_removed_mode", false)
                .putLong("lock_end_timestamp", 0L)
                .apply()

            // Release Device Admin so user can safely manage or uninstall app if needed
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val adminComponent = ComponentName(context, ReelDeviceAdminReceiver::class.java)
            if (dpm.isAdminActive(adminComponent)) {
                dpm.removeActiveAdmin(adminComponent)
            }
            return true
        }
        return false
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
`
  },
  {
    path: "app/src/main/java/com/reelshield/blocker/ReelBlockerAccessibilityService.kt",
    category: "kotlin",
    description: "Reels/Shorts Scroll डिटेक्शन आणि Anti-Uninstall संरक्षण सर्विस",
    content: `package com.reelshield.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast

/**
 * ReelBlockerAccessibilityService
 * 1. Blocks Reel / Shorts / Spotlight scrolling in Instagram, YouTube, Snapchat.
 * 2. Blocks Uninstall & Force Stop from Home Screen Launchers, Package Installer, and Settings.
 */
class ReelBlockerAccessibilityService : AccessibilityService() {

    private val defaultBlockedPackages = setOf(
        "com.instagram.android",
        "com.google.android.youtube",
        "com.snapchat.android"
    )

    private val reelContainerViewIds = listOf(
        "com.instagram.android:id/clips_viewer_view_pager",
        "com.instagram.android:id/reel_viewer_root",
        "com.google.android.youtube:id/reel_recycler",
        "com.google.android.youtube:id/reel_watch_fragment_root",
        "com.google.android.youtube:id/reel_player_page_tree",
        "com.snapchat.android:id/spotlight_view_pager",
        "com.snapchat.android:id/spotlight_feed_container"
    )

    private val systemAndLauncherPackages = setOf(
        "com.android.settings",
        "com.google.android.packageinstaller",
        "com.android.packageinstaller",
        "com.miui.securitycenter",
        "com.sec.android.app.launcher",
        "com.google.android.apps.nexuslauncher",
        "com.miui.home",
        "com.android.launcher3",
        "net.oneplus.launcher",
        "com.coloros.launcher",
        "com.oppo.launcher",
        "com.bbk.launcher2"
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val lockManager = ReelShieldLockManager(this)

        if (!lockManager.isProtectionCurrentlyLocked()) return

        val packageName = event.packageName?.toString() ?: return

        // 1. Anti-Uninstall & Anti-Disable Everywhere
        if (systemAndLauncherPackages.contains(packageName) || packageName.contains("launcher") || packageName.contains("settings")) {
            val rootNode = rootInActiveWindow ?: return
            if (containsTamperOrHomeUninstallAttempt(rootNode)) {
                performGlobalAction(GLOBAL_ACTION_BACK)
                performGlobalAction(GLOBAL_ACTION_HOME)
                Toast.makeText(
                    this,
                    "ReelShield लॉक सुरू आहे! पासवर्ड टाकल्याशिवाय Home Screen किंवा Settings मधून Uninstall/Off करता येणार नाही.",
                    Toast.LENGTH_LONG
                ).show()
                return
            }
        }

        // 2. Check if current app is selected in APK Blocklist
        val prefs = getSharedPreferences("reel_shield_prefs", Context.MODE_PRIVATE)
        val activePackages = prefs.getStringSet("selected_packages", defaultBlockedPackages) ?: defaultBlockedPackages
        if (!activePackages.contains(packageName)) return

        // 3. Inspect UI Node Tree ONLY for Reel / Shorts / Spotlight Scroll Containers
        val rootNode = rootInActiveWindow ?: return
        if (isReelScrollDetected(rootNode, event)) {
            performGlobalAction(GLOBAL_ACTION_BACK)
            Toast.makeText(
                this,
                "Reel/Shorts Scroll ब्लॉक केले आहे! बाकी ॲप (Chat/Search/Calls) तुम्ही वापरू शकता.",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    private fun isReelScrollDetected(root: AccessibilityNodeInfo, event: AccessibilityEvent): Boolean {
        for (viewId in reelContainerViewIds) {
            val matches = root.findAccessibilityNodeInfosByViewId(viewId)
            if (!matches.isNullOrEmpty()) {
                return true
            }
        }

        if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
            val reelsTabSelected = root.findAccessibilityNodeInfosByText("Reels")
                .any { it.isSelected && it.isVisibleToUser }
            val shortsTabSelected = root.findAccessibilityNodeInfosByText("Shorts")
                .any { it.isSelected && it.isVisibleToUser }
            if (reelsTabSelected || shortsTabSelected) {
                return true
            }
        }
        return false
    }

    private fun containsTamperOrHomeUninstallAttempt(root: AccessibilityNodeInfo): Boolean {
        val appMentioned = root.findAccessibilityNodeInfosByText("ReelShield").isNotEmpty()
        if (!appMentioned) return false

        val dangerKeywords = listOf(
            "Uninstall", "Force stop", "Device admin", "Deactivate",
            "Delete", "Remove", "Clear storage", "Clear data", "अनिंस्टॉल", "फोर्स स्टॉप"
        )
        return dangerKeywords.any { word ->
            root.findAccessibilityNodeInfosByText(word).isNotEmpty()
        }
    }

    override fun onInterrupt() {}
}
`
  },
  {
    path: "app/src/main/java/com/reelshield/blocker/PostInstallPermissionWizard.kt",
    category: "kotlin",
    description: "Device Admin, Accessibility, Overlay, Battery ऑप्टिमायझेशन परवानग्या विझार्ड",
    content: `package com.reelshield.blocker

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

class PostInstallPermissionWizard(private val activity: Activity) {

    fun requestAllRequiredPermissionsSequentially() {
        val dpm = activity.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminComponent = ComponentName(activity, ReelDeviceAdminReceiver::class.java)

        // 1. Device Admin
        if (!dpm.isAdminActive(adminComponent)) {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "ReelShield ला Home Screen वरून किंवा Settings मधून कोणीही डिलीट (Uninstall) करू नये म्हणून ही Admin परवानगी आवश्यक आहे."
                )
            }
            activity.startActivity(intent)
            return
        }

        // 2. Draw Overlays (System Alert Window)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(activity)) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:\${activity.packageName}")
            )
            activity.startActivity(intent)
            return
        }

        // 3. Ignore Battery Optimization
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = activity.getSystemService(Context.POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(activity.packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:\${activity.packageName}")
                }
                activity.startActivity(intent)
                return
            }
        }

        // 4. Accessibility Service
        if (!isAccessibilityServiceEnabled()) {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            activity.startActivity(intent)
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expectedComponentName = ComponentName(activity, ReelBlockerAccessibilityService::class.java)
        val enabledServicesSetting = Settings.Secure.getString(
            activity.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        return enabledServicesSetting.contains(expectedComponentName.flattenToString())
    }
}
`
  },
  {
    path: "app/src/main/java/com/reelshield/blocker/ReelDeviceAdminReceiver.kt",
    category: "kotlin",
    description: "OS-Level Device Admin रीसिव्हर जे थेट Uninstall ब्लॉक करते",
    content: `package com.reelshield.blocker

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

class ReelDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "चेतावणी: ReelShield लॉक सुरू आहे! पासवर्ड टाकल्याशिवाय हे APK कुठूनही बंद किंवा Uninstall करता येणार नाही."
    }

    override fun onEnabled(context: Context, intent: Intent) {
        Toast.makeText(
            context,
            "Device Admin सक्रिय! आता Home Screen किंवा कुठूनही APK Uninstall होऊ शकत नाही.",
            Toast.LENGTH_LONG
        ).show()
    }
}
`
  },
  {
    path: "app/src/main/AndroidManifest.xml",
    category: "manifest",
    description: "Android App Manifest ज्यामध्ये सर्व आवश्यक Permissions व Services समाविष्ट आहेत",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.reelshield.blocker">

    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ReelShield"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ReelShield">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Accessibility Service for Reel Blocking & Anti-Uninstall -->
        <service
            android:name=".ReelBlockerAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

        <!-- Device Admin Receiver to Block Uninstallation -->
        <receiver
            android:name=".ReelDeviceAdminReceiver"
            android:permission="android.permission.BIND_DEVICE_ADMIN"
            android:exported="true">
            <meta-data
                android:name="android.app.device_admin"
                android:resource="@xml/device_admin_sample" />
            <intent-filter>
                <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
                <action android:name="android.app.action.DEVICE_ADMIN_DISABLE_REQUESTED" />
                <action android:name="android.app.action.DEVICE_ADMIN_DISABLED" />
            </intent-filter>
        </receiver>

    </application>

</manifest>
`
  },
  {
    path: "app/src/main/res/xml/accessibility_service_config.xml",
    category: "res",
    description: "Accessibility Service XML कॉन्फिगरेशन",
    content: `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeViewScrolled|typeWindowStateChanged|typeWindowContentChanged|typeViewClicked"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagReportViewIds"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_desc"
    android:notificationTimeout="50" />
`
  },
  {
    path: "app/src/main/res/xml/device_admin_sample.xml",
    category: "res",
    description: "Device Admin Policies XML कॉन्फिगरेशन",
    content: `<?xml version="1.0" encoding="utf-8"?>
<device-admin xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-policies>
        <force-lock />
        <wipe-data />
        <reset-password />
        <watch-login />
    </uses-policies>
</device-admin>
`
  },
  {
    path: "app/src/main/res/values/strings.xml",
    category: "res",
    description: "Strings resource (मराठी व इंग्रजी लेबल्स)",
    content: `<resources>
    <string name="app_name">ReelShield</string>
    <string name="accessibility_desc">ReelShield ला फक्त इन्स्टाग्राम रील्स आणि यूट्यूब शॉर्ट्स स्क्रोल ब्लॉक करण्यासाठी आणि अनधिकृत अनइन्स्टॉल रोखण्यासाठी ऍक्सेसिबिलिटी परवानगी आवश्यक आहे.</string>
</resources>
`
  },
  {
    path: "app/build.gradle",
    category: "gradle",
    description: "App Module Gradle build configuration",
    content: `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace 'com.reelshield.blocker'
    compileSdk 34

    defaultConfig {
        applicationId "com.reelshield.blocker"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
        debug {
            applicationIdSuffix ".debug"
            debuggable true
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.13.1'
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}
`
  },
  {
    path: ".github/workflows/build-apk-cloud.yml",
    category: "workflow",
    description: "1-Click GitHub Actions Cloud APK Builder (मोबाईल किंवा PC वरून थेट APK डाऊनलोड करा)",
    content: `name: Build Ready-to-Install Android APK (Cloud Builder)

on:
  workflow_dispatch:
  push:
    branches: [ main, master ]

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17 for Android Compilation
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Build Ready-to-Install Android APK
        run: |
          if [ -f "./gradlew" ]; then
            chmod +x gradlew
            ./gradlew assembleDebug --no-daemon
          else
            gradle assembleDebug --no-daemon
          fi

      - name: Upload Ready-to-Install ReelShield.apk
        uses: actions/upload-artifact@v4
        with:
          name: ReelShield-Ready-To-Install-APK
          path: app/build/outputs/apk/debug/*.apk
`
  }
];
