package com.goaltoaction.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Keeps the reminder list computed by the web UI and turns it into alarms.
 * Times are stored as local date + time so they are recomputed after a reboot or a time zone change.
 */
final class Scheduler {
    static final String PREFS = "reminders";
    static final String ACTION_REMIND = "com.goaltoaction.app.REMIND";

    private Scheduler() {
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static synchronized void replaceAll(Context c, String json) {
        try {
            SharedPreferences p = prefs(c);
            JSONArray old = new JSONArray(p.getString("items", "[]"));
            for (int i = 0; i < old.length(); i++) cancel(c, old.getJSONObject(i).getInt("id"));
            JSONArray items = new JSONArray(json);
            p.edit().putString("items", items.toString()).putString("done", "[]").apply();
            for (int i = 0; i < items.length(); i++) schedule(c, items.getJSONObject(i));
        } catch (Exception ignored) {
        }
    }

    static synchronized void rescheduleAll(Context c) {
        try {
            JSONArray items = new JSONArray(prefs(c).getString("items", "[]"));
            for (int i = 0; i < items.length(); i++) schedule(c, items.getJSONObject(i));
        } catch (Exception ignored) {
        }
    }

    static synchronized void addItem(Context c, JSONObject item) {
        try {
            SharedPreferences p = prefs(c);
            JSONArray items = new JSONArray(p.getString("items", "[]"));
            items.put(item);
            p.edit().putString("items", items.toString()).apply();
            schedule(c, item);
        } catch (Exception ignored) {
        }
    }

    static long timeOf(JSONObject item) {
        try {
            String[] d = item.getString("date").split("-");
            String[] t = item.getString("time").split(":");
            Calendar cal = Calendar.getInstance();
            cal.set(Integer.parseInt(d[0]), Integer.parseInt(d[1]) - 1, Integer.parseInt(d[2]),
                    Integer.parseInt(t[0]), Integer.parseInt(t[1]), 0);
            cal.set(Calendar.MILLISECOND, 0);
            return cal.getTimeInMillis();
        } catch (Exception e) {
            return -1;
        }
    }

    private static PendingIntent pending(Context c, int id, String item, int flags) {
        Intent i = new Intent(c, ReminderReceiver.class);
        i.setAction(ACTION_REMIND);
        if (item != null) i.putExtra("item", item);
        return PendingIntent.getBroadcast(c, id, i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    static void schedule(Context c, JSONObject item) {
        long at = timeOf(item);
        if (at <= System.currentTimeMillis()) return;
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            PendingIntent pi = pending(c, item.getInt("id"), item.toString(), PendingIntent.FLAG_UPDATE_CURRENT);
            boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
            if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (Exception ignored) {
        }
    }

    static void cancel(Context c, int id) {
        try {
            PendingIntent pi = pending(c, id, null, PendingIntent.FLAG_NO_CREATE);
            if (pi != null) {
                AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
                am.cancel(pi);
                pi.cancel();
            }
        } catch (Exception ignored) {
        }
    }

    // ---- actions taken from notifications, handed to the UI on next resume ----
    static synchronized void addEvent(Context c, JSONObject ev) {
        try {
            SharedPreferences p = prefs(c);
            JSONArray arr = new JSONArray(p.getString("events", "[]"));
            arr.put(ev);
            p.edit().putString("events", arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    static synchronized String consumeEvents(Context c) {
        SharedPreferences p = prefs(c);
        String s = p.getString("events", "[]");
        p.edit().putString("events", "[]").apply();
        return s;
    }

    static synchronized void markDone(Context c, String key) {
        try {
            SharedPreferences p = prefs(c);
            JSONArray arr = new JSONArray(p.getString("done", "[]"));
            arr.put(key);
            p.edit().putString("done", arr.toString()).apply();
        } catch (Exception ignored) {
        }
    }

    static synchronized boolean isDone(Context c, String key) {
        try {
            JSONArray arr = new JSONArray(prefs(c).getString("done", "[]"));
            for (int i = 0; i < arr.length(); i++) if (key.equals(arr.getString(i))) return true;
        } catch (Exception ignored) {
        }
        return false;
    }

    static synchronized int doneOnDate(Context c, String date) {
        int n = 0;
        try {
            JSONArray arr = new JSONArray(prefs(c).getString("done", "[]"));
            for (int i = 0; i < arr.length(); i++) if (arr.getString(i).endsWith("|" + date)) n++;
        } catch (Exception ignored) {
        }
        return n;
    }
}
