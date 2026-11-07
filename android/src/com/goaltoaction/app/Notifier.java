package com.goaltoaction.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.os.Build;

import org.json.JSONObject;

final class Notifier {
    static final String CH_REMIND = "reminders";
    static final String CH_CHECKIN = "checkins";
    static final String ACTION_DONE = "com.goaltoaction.app.DONE";
    static final String ACTION_SNOOZE = "com.goaltoaction.app.SNOOZE";

    private Notifier() {
    }

    static void ensureChannels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel r = new NotificationChannel(CH_REMIND, "یادآوری اقدام‌ها", NotificationManager.IMPORTANCE_HIGH);
        r.setDescription("زمان انجام اقدام‌های روزانه");
        nm.createNotificationChannel(r);
        NotificationChannel k = new NotificationChannel(CH_CHECKIN, "جمع‌بندی و پیگیری", NotificationManager.IMPORTANCE_DEFAULT);
        k.setDescription("پیگیری اقدام‌های انجام‌نشده و جمع‌بندی عصر");
        nm.createNotificationChannel(k);
    }

    static boolean allowed(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        return nm != null && nm.areNotificationsEnabled();
    }

    static void cancel(Context c, int id) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(id);
    }

    static void show(Context c, JSONObject item) {
        try {
            int id = item.getInt("id");
            String kind = item.optString("kind", "main");
            String key = item.optString("key", "");
            String channel = "main".equals(kind) ? CH_REMIND : CH_CHECKIN;

            Notification.Builder b = Build.VERSION.SDK_INT >= 26
                    ? new Notification.Builder(c, channel)
                    : new Notification.Builder(c);
            b.setSmallIcon(R.drawable.ic_stat)
                    .setContentTitle(item.optString("title"))
                    .setContentText(item.optString("body"))
                    .setStyle(new Notification.BigTextStyle().bigText(item.optString("body")))
                    .setColor(0xFF4F46E5)
                    .setAutoCancel(true)
                    .setCategory(Notification.CATEGORY_REMINDER)
                    .setShowWhen(true);
            if (Build.VERSION.SDK_INT < 26) {
                b.setPriority("main".equals(kind) ? Notification.PRIORITY_HIGH : Notification.PRIORITY_DEFAULT);
                b.setDefaults(Notification.DEFAULT_ALL);
            }

            Intent open = new Intent(c, MainActivity.class);
            open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            if (!"checkin".equals(kind)) open.putExtra("open_key", key);
            b.setContentIntent(PendingIntent.getActivity(c, id, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));

            if (!"checkin".equals(kind) && key.length() > 0) {
                b.addAction(new Notification.Action.Builder(
                        Icon.createWithResource(c, R.drawable.ic_stat), "انجام شد",
                        actionIntent(c, ACTION_DONE, id, item)).build());
                b.addAction(new Notification.Action.Builder(
                        Icon.createWithResource(c, R.drawable.ic_stat), "۱۰ دقیقه بعد",
                        actionIntent(c, ACTION_SNOOZE, id, item)).build());
            }
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            nm.notify(id, b.build());
        } catch (Exception ignored) {
        }
    }

    private static PendingIntent actionIntent(Context c, String action, int id, JSONObject item) {
        Intent i = new Intent(c, ReminderReceiver.class);
        i.setAction(action);
        i.putExtra("item", item.toString());
        int req = action.equals(ACTION_DONE) ? id ^ 0x10000000 : id ^ 0x20000000;
        return PendingIntent.getBroadcast(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
