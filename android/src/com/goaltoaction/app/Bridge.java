package com.goaltoaction.app;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import org.json.JSONArray;

import java.io.File;

/** Methods exposed to the web UI as window.Android. */
public class Bridge {
    private final MainActivity a;

    Bridge(MainActivity activity) {
        a = activity;
    }

    @JavascriptInterface
    public String loadState() {
        return Store.read(a, "state.json");
    }

    @JavascriptInterface
    public void saveState(String json) {
        Store.write(a, "state.json", json);
    }

    @JavascriptInterface
    public void syncReminders(String json) {
        Scheduler.replaceAll(a, json);
    }

    @JavascriptInterface
    public String consumeEvents() {
        return Scheduler.consumeEvents(a);
    }

    @JavascriptInterface
    public boolean notificationsAllowed() {
        return Notifier.allowed(a);
    }

    @JavascriptInterface
    public void requestNotifications() {
        a.runOnUiThread(new Runnable() {
            public void run() {
                a.requestNotificationPermission();
            }
        });
    }

    @JavascriptInterface
    public boolean exactAlarmsAllowed() {
        if (Build.VERSION.SDK_INT < 31) return true;
        AlarmManager am = (AlarmManager) a.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    @JavascriptInterface
    public void openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT >= 31) {
            open(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + a.getPackageName())));
        }
    }

    @JavascriptInterface
    public void openNotificationSettings() {
        Intent i;
        if (Build.VERSION.SDK_INT >= 26) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            i.putExtra(Settings.EXTRA_APP_PACKAGE, a.getPackageName());
        } else {
            i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + a.getPackageName()));
        }
        open(i);
    }

    @JavascriptInterface
    public void openBatterySettings() {
        open(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
    }

    private void open(final Intent i) {
        a.runOnUiThread(new Runnable() {
            public void run() {
                try {
                    a.startActivity(i);
                } catch (Exception e) {
                    try {
                        a.startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + a.getPackageName())));
                    } catch (Exception ignored) {
                    }
                }
            }
        });
    }

    @JavascriptInterface
    public void exportFile(final String name, final String content) {
        a.runOnUiThread(new Runnable() {
            public void run() {
                a.startExport(name, content);
            }
        });
    }

    private static String safe(String name) {
        return name.replaceAll("[^A-Za-z0-9._\\-\\[\\]]", "_");
    }

    @JavascriptInterface
    public void saveFont(String name, String base64) {
        Store.write(a, "fonts/" + safe(name), base64);
    }

    @JavascriptInterface
    public String listFonts() {
        JSONArray arr = new JSONArray();
        File dir = new File(a.getFilesDir(), "fonts");
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) arr.put(f.getName());
        return arr.toString();
    }

    @JavascriptInterface
    public String loadFont(String name) {
        return Store.read(a, "fonts/" + safe(name));
    }

    @JavascriptInterface
    public void clearFonts() {
        File dir = new File(a.getFilesDir(), "fonts");
        File[] files = dir.listFiles();
        if (files != null) for (File f : files) f.delete();
    }

    @JavascriptInterface
    public void setSystemBars(final String color, final boolean dark) {
        a.runOnUiThread(new Runnable() {
            public void run() {
                a.setSystemBars(color, dark);
            }
        });
    }

    @JavascriptInterface
    public void haptic() {
        a.runOnUiThread(new Runnable() {
            public void run() {
                a.haptic();
            }
        });
    }

    @JavascriptInterface
    public void toast(final String msg) {
        a.runOnUiThread(new Runnable() {
            public void run() {
                Toast.makeText(a, msg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    @JavascriptInterface
    public String version() {
        try {
            return a.getPackageManager().getPackageInfo(a.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public boolean isNightMode() {
        return a.isNight();
    }

    @JavascriptInterface
    public int sdk() {
        return Build.VERSION.SDK_INT;
    }
}
