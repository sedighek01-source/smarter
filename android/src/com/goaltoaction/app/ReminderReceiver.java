package com.goaltoaction.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        String action = intent.getAction();
        String raw = intent.getStringExtra("item");
        if (action == null || raw == null) return;
        try {
            JSONObject item = new JSONObject(raw);
            String key = item.optString("key", "");
            String kind = item.optString("kind", "main");
            int id = item.getInt("id");

            if (Scheduler.ACTION_REMIND.equals(action)) {
                if (("main".equals(kind) || "follow".equals(kind)) && Scheduler.isDone(c, key)) return;
                if ("checkin".equals(kind)) {
                    int left = item.optInt("count", 0) - Scheduler.doneOnDate(c, item.optString("date"));
                    if (left < 2) return;
                }
                Notifier.show(c, item);
            } else if (Notifier.ACTION_DONE.equals(action)) {
                Notifier.cancel(c, id);
                Scheduler.markDone(c, key);
                JSONObject ev = new JSONObject();
                ev.put("type", "done");
                ev.put("key", key);
                ev.put("at", System.currentTimeMillis());
                Scheduler.addEvent(c, ev);
            } else if (Notifier.ACTION_SNOOZE.equals(action)) {
                Notifier.cancel(c, id);
                Calendar cal = Calendar.getInstance();
                cal.add(Calendar.MINUTE, 10);
                JSONObject again = new JSONObject(raw);
                again.put("id", (id ^ 0x08000000) + (int) (System.currentTimeMillis() / 60000 % 1000));
                again.put("date", new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.getTime()));
                again.put("time", new SimpleDateFormat("HH:mm", Locale.US).format(cal.getTime()));
                again.put("kind", "main");
                Scheduler.addItem(c, again);
                JSONObject ev = new JSONObject();
                ev.put("type", "snooze");
                ev.put("key", key);
                ev.put("until", again.getString("time"));
                ev.put("at", System.currentTimeMillis());
                Scheduler.addEvent(c, ev);
            }
        } catch (Exception ignored) {
        }
    }
}
