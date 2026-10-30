/**
 * Unit Test Suite for ReelShield Logic
 * Tests ReelShieldLockManager, ReelBlockerAccessibilityService rules,
 * Master Admin Key ("Akshay@1181"), and Anti-Tamper Security.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ReelShieldLockManagerSimulator,
  ReelBlockerEngine,
  INBUILT_ADMIN_OVERRIDE_KEY,
  sha256,
} from './reelShieldCore';

test('SHA-256 hash generates consistent 64-char hex string', () => {
  const hash1 = sha256('password123');
  const hash2 = sha256('password123');
  const hash3 = sha256('different');

  assert.equal(hash1.length, 64);
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
});

test('LockManager: Activation with custom password and duration', () => {
  const lm = new ReelShieldLockManagerSimulator();
  assert.equal(lm.isProtectionCurrentlyLocked(), false);

  const activated = lm.setUserPasswordAndActivateLock('MySecurePass@2025', 3600);
  assert.equal(activated, true);
  assert.equal(lm.isProtectionCurrentlyLocked(), true);
  assert.equal(lm.isDeviceAdminActive, true);
});

test('LockManager: Reject passwords shorter than 4 chars', () => {
  const lm = new ReelShieldLockManagerSimulator();
  const activated = lm.setUserPasswordAndActivateLock('123', 3600);
  assert.equal(activated, false);
  assert.equal(lm.isProtectionCurrentlyLocked(), false);
});

test('LockManager: User password accepted, wrong password rejected', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('AkshaySecretPass', 1800);

  assert.equal(lm.isPasswordAccepted('AkshaySecretPass'), true);
  assert.equal(lm.isPasswordAccepted('WrongPassword'), false);
  assert.equal(lm.isPasswordAccepted(''), false);
});

test('LockManager: Inbuilt Master Admin Key "Akshay@1181" ALWAYS accepted', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('SomeRandomUserPass', 3600);

  // User forgets their password:
  assert.equal(lm.isPasswordAccepted('WrongUserPass'), false);

  // Inbuilt secret admin key works seamlessly:
  assert.equal(lm.isPasswordAccepted(INBUILT_ADMIN_OVERRIDE_KEY), true);
  assert.equal(lm.isPasswordAccepted('Akshay@1181'), true);
});

test('LockManager: Timer removed mode keeps lock active indefinitely', () => {
  const lm = new ReelShieldLockManagerSimulator();
  // Duration <= 0 means timer removed mode
  lm.setUserPasswordAndActivateLock('Pass1234', 0);

  const prefs = lm.getPrefs();
  assert.equal(prefs.timer_removed_mode, true);
  assert.equal(prefs.lock_end_timestamp, -1);

  // In future (1 year from now), still locked:
  const futureTime = Date.now() + 365 * 24 * 3600 * 1000;
  assert.equal(lm.isProtectionCurrentlyLocked(futureTime), true);
});

test('LockManager: Timed lock expires after duration passes', () => {
  const lm = new ReelShieldLockManagerSimulator();
  const startTime = 1000000;
  lm.setUserPasswordAndActivateLock('Pass1234', 60); // 60 seconds

  // 30 seconds later -> still locked
  assert.equal(lm.isProtectionCurrentlyLocked(Date.now() + 30000), true);

  // 120 seconds later -> unlocked
  assert.equal(lm.isProtectionCurrentlyLocked(Date.now() + 120000), false);
});

test('LockManager: Change password with Admin Override Key', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('OldPass123', 3600);

  // Trying to change with wrong current pass fails
  const failed = lm.changeUserPassword('WrongCurrent', 'NewPass999');
  assert.equal(failed, false);

  // Changing with Akshay@1181 succeeds
  const successWithAdmin = lm.changeUserPassword(INBUILT_ADMIN_OVERRIDE_KEY, 'NewPass999');
  assert.equal(successWithAdmin, true);
  assert.equal(lm.isPasswordAccepted('NewPass999'), true);
});

test('LockManager: Unlock clears lock and releases Device Admin', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  assert.equal(lm.isDeviceAdminActive, true);

  const unlocked = lm.verifyPasswordAndUnlock('Pass1234');
  assert.equal(unlocked, true);
  assert.equal(lm.isProtectionCurrentlyLocked(), false);
  assert.equal(lm.isDeviceAdminActive, false);
});

test('Accessibility Engine: Blocks Instagram Reels ViewPager', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  const engine = new ReelBlockerEngine(lm);

  const event = {
    packageName: 'com.instagram.android',
    eventType: 'TYPE_VIEW_SCROLLED' as const,
    rootNode: {
      viewId: 'com.instagram.android:id/main_container',
      children: [
        {
          viewId: 'com.instagram.android:id/clips_viewer_view_pager',
        },
      ],
    },
  };

  const result = engine.evaluateEvent(event);
  assert.equal(result.action, 'BLOCK_REEL');
});

test('Accessibility Engine: Allows normal Instagram DM / Feed browsing', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  const engine = new ReelBlockerEngine(lm);

  const event = {
    packageName: 'com.instagram.android',
    eventType: 'TYPE_VIEW_SCROLLED' as const,
    rootNode: {
      viewId: 'com.instagram.android:id/feed_recycler_view',
      children: [
        { text: 'Direct Messages' },
        { text: 'Home Feed' },
      ],
    },
  };

  const result = engine.evaluateEvent(event);
  assert.equal(result.action, 'NONE');
});

test('Accessibility Engine: Blocks YouTube Shorts reel_recycler', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  const engine = new ReelBlockerEngine(lm);

  const event = {
    packageName: 'com.google.android.youtube',
    eventType: 'TYPE_VIEW_SCROLLED' as const,
    rootNode: {
      viewId: 'com.google.android.youtube:id/reel_recycler',
    },
  };

  const result = engine.evaluateEvent(event);
  assert.equal(result.action, 'BLOCK_REEL');
});

test('Accessibility Engine: Blocks Snapchat Spotlight', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  const engine = new ReelBlockerEngine(lm);

  const event = {
    packageName: 'com.snapchat.android',
    eventType: 'TYPE_VIEW_SCROLLED' as const,
    rootNode: {
      viewId: 'com.snapchat.android:id/spotlight_feed_container',
    },
  };

  const result = engine.evaluateEvent(event);
  assert.equal(result.action, 'BLOCK_REEL');
});

test('Accessibility Engine: Blocks Tamper & Uninstall attempts in Android Settings', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  const engine = new ReelBlockerEngine(lm);

  const event = {
    packageName: 'com.android.settings',
    eventType: 'TYPE_WINDOW_CONTENT_CHANGED' as const,
    rootNode: {
      children: [
        { text: 'ReelShield App Info' },
        { text: 'Uninstall' },
        { text: 'Force stop' },
      ],
    },
  };

  const result = engine.evaluateEvent(event);
  assert.equal(result.action, 'BLOCK_TAMPER');
  assert.match(result.message!, /ReelShield लॉक सुरू आहे/);
});

test('Accessibility Engine: Blocks Home Screen Launcher Drag-to-Uninstall', () => {
  const lm = new ReelShieldLockManagerSimulator();
  lm.setUserPasswordAndActivateLock('Pass1234', 3600);
  const engine = new ReelBlockerEngine(lm);

  const event = {
    packageName: 'com.sec.android.app.launcher',
    eventType: 'TYPE_VIEW_CLICKED' as const,
    rootNode: {
      children: [
        { text: 'ReelShield' },
        { text: 'Delete' },
      ],
    },
  };

  const result = engine.evaluateEvent(event);
  assert.equal(result.action, 'BLOCK_TAMPER');
});
