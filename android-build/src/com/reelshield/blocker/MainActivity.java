package com.reelshield.blocker;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class MainActivity extends Activity {
    private ReelShieldLockManager lockManager;
    private TextView statusText;
    private TextView timerText;
    private Button btnToggleShield;
    private Button btnChangePassword;
    private Button btnCheckPermissions;
    private CountDownTimer countDownTimer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        lockManager = new ReelShieldLockManager(this);

        statusText = (TextView) findViewById(R.id.tvShieldStatus);
        timerText = (TextView) findViewById(R.id.tvTimerRemaining);
        btnToggleShield = (Button) findViewById(R.id.btnToggleShield);
        btnChangePassword = (Button) findViewById(R.id.btnChangePassword);
        btnCheckPermissions = (Button) findViewById(R.id.btnCheckPermissions);

        updateUiState();

        btnToggleShield.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (lockManager.isProtectionCurrentlyLocked()) {
                    showUnlockDialog();
                } else {
                    showActivateLockDialog();
                }
            }
        });

        btnChangePassword.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showChangePasswordDialog();
            }
        });

        btnCheckPermissions.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                new PostInstallPermissionWizard(MainActivity.this).requestAllRequiredPermissionsSequentially();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateUiState();
    }

    private void updateUiState() {
        boolean isLocked = lockManager.isProtectionCurrentlyLocked();
        if (isLocked) {
            statusText.setText("🛡️ ReelShield सक्रिय (LOCKED)");
            statusText.setTextColor(0xFF10b981);
            btnToggleShield.setText("🔓 पासवर्ड टाकून अनलॉक करा");
            startCountDown();
        } else {
            statusText.setText("⚠️ ReelShield निष्क्रिय (UNLOCKED)");
            statusText.setTextColor(0xFFf59e0b);
            btnToggleShield.setText("🔒 ReelShield सुरू करा (Lock)");
            timerText.setText("लॉक बंद आहे.");
            if (countDownTimer != null) countDownTimer.cancel();
        }
    }

    private void startCountDown() {
        if (countDownTimer != null) countDownTimer.cancel();
        SharedPreferences prefs = getSharedPreferences("reel_shield_prefs", Context.MODE_PRIVATE);
        boolean isPermanent = prefs.getBoolean("timer_removed_mode", false);
        if (isPermanent) {
            timerText.setText("कधीही संपणार नाही (Permanent Mode)");
            return;
        }

        long endTimestamp = prefs.getLong("lock_end_timestamp", 0L);
        long remainingMillis = endTimestamp - System.currentTimeMillis();
        if (remainingMillis <= 0) {
            timerText.setText("टायमर संपला आहे.");
            return;
        }

        countDownTimer = new CountDownTimer(remainingMillis, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                long h = millisUntilFinished / (1000 * 60 * 60);
                long m = (millisUntilFinished % (1000 * 60 * 60)) / (1000 * 60);
                long s = (millisUntilFinished % (1000 * 60)) / 1000;
                timerText.setText(String.format("उर्वरित वेळ: %02d:%02d:%02d", h, m, s));
            }
            @Override
            public void onFinish() { updateUiState(); }
        }.start();
    }

    private void showActivateLockDialog() {
        final EditText input = new EditText(this);
        input.setHint("पासवर्ड टाका (उदा. 1234)");

        new AlertDialog.Builder(this)
            .setTitle("ReelShield पासवर्ड सेट करा")
            .setView(input)
            .setPositiveButton("सुरू करा", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    String pass = input.getText().toString().trim();
                    if (pass.length() < 4) {
                        Toast.makeText(MainActivity.this, "पासवर्ड किमान ४ अक्षरांचा असावा!", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    Set<String> packages = new HashSet<>(Arrays.asList(
                        "com.instagram.android", "com.google.android.youtube", "com.snapchat.android"
                    ));
                    lockManager.setUserPasswordAndActivateLock(pass, 3600L, packages);
                    Toast.makeText(MainActivity.this, "ReelShield सक्रिय झाले!", Toast.LENGTH_LONG).show();
                    updateUiState();
                }
            })
            .setNegativeButton("रद्द करा", null)
            .show();
    }

    private void showUnlockDialog() {
        final EditText input = new EditText(this);
        input.setHint("पासवर्ड (किंवा Akshay@1181)");

        new AlertDialog.Builder(this)
            .setTitle("ReelShield अनलॉक करा")
            .setView(input)
            .setPositiveButton("अनलॉक", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    String pass = input.getText().toString();
                    if (lockManager.verifyPasswordAndUnlock(pass)) {
                        Toast.makeText(MainActivity.this, "अनलॉक यशस्वी!", Toast.LENGTH_SHORT).show();
                        updateUiState();
                    } else {
                        Toast.makeText(MainActivity.this, "चुकीचा पासवर्ड!", Toast.LENGTH_SHORT).show();
                    }
                }
            })
            .setNegativeButton("रद्द करा", null)
            .show();
    }

    private void showChangePasswordDialog() {
        final EditText input = new EditText(this);
        input.setHint("सध्याचा पासवर्ड (किंवा Akshay@1181)");

        new AlertDialog.Builder(this)
            .setTitle("पासवर्ड बदला")
            .setView(input)
            .setPositiveButton("पुढे", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    String curr = input.getText().toString();
                    if (lockManager.isPasswordAccepted(curr)) {
                        showNewPasswordDialog(curr);
                    } else {
                        Toast.makeText(MainActivity.this, "सध्याचा पासवर्ड चुकीचा आहे!", Toast.LENGTH_SHORT).show();
                    }
                }
            })
            .setNegativeButton("रद्द करा", null)
            .show();
    }

    private void showNewPasswordDialog(final String currentPass) {
        final EditText input = new EditText(this);
        input.setHint("नवीन पासवर्ड (किमान ४ अक्षरे)");

        new AlertDialog.Builder(this)
            .setTitle("नवीन पासवर्ड टाका")
            .setView(input)
            .setPositiveButton("सेव्ह करा", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    String newP = input.getText().toString();
                    if (lockManager.changeUserPassword(currentPass, newP)) {
                        Toast.makeText(MainActivity.this, "नवीन पासवर्ड सेव्ह झाला!", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(MainActivity.this, "नवीन पासवर्ड अमान्य आहे!", Toast.LENGTH_SHORT).show();
                    }
                }
            })
            .setNegativeButton("रद्द करा", null)
            .show();
    }
}
