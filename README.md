# هدف به اقدام — نمونه اولیه Android (نسخه 0.9.0)

نمونه اولیه آفلاین اپلیکیشن «Goal-to-Action» بر اساس سند مشخصات نسخه ۲.۰.

## ساختار

- `web/` — رابط کاربری (HTML/CSS/JS بدون وابستگی خارجی)
  - `js/core.js` — ارقام فارسی، تقویم جلالی، تاریخ‌ها، ذخیره‌سازی
  - `js/engine.js` — تحلیل متن هدف، SMART، تولید برنامه، نمونه‌های روزانه، XP، Streak، قوانین Adaptive، محاسبه یادآوری‌ها، مربی قاعده‌محور
  - `js/ui.js` — صفحه‌ها، Sheetها و رویدادها
  - `css/font.css` — فونت وزیرمتن (OFL) به‌صورت جاسازی‌شده
- `android/` — پوسته بومی: WebView، پل JavaScript، زمان‌بندی اعلان با AlarmManager، Receiver اعلان و راه‌اندازی مجدد
- `build.sh` — ساخت APK بدون Gradle (aapt2، javac، dx، zipalign، apksigner)
- `tools/make_icons.py` — تولید آیکون‌ها
- `test/` — تست موتور (Node) و پیمایش رابط کاربری (Playwright)

## اجرا در مرورگر

فایل `web/index.html` را در Chrome باز کنید (داده‌ها در localStorage ذخیره می‌شوند).

## ساخت APK

پیش‌نیاز: JDK، بسته‌های `aapt`، `apksigner`، `zipalign`، `dalvik-exchange` و یک `android.jar` (API 34):

```
ANDROID_JAR=/path/to/android-34/android.jar ./build.sh
```

خروجی: `build/GoalToAction-0.9.0.apk` (امضاشده با کلید آزمایشی؛ برای انتشار باید با Keystore رسمی امضا شود).

## فونت پیدا

فونت پیدا تجاری است و داخل بسته قرار نگرفته. از تنظیمات اپ ← ظاهر ← «وارد کردن»، فایل‌های TTF/WOFF2 دارای مجوز را انتخاب کنید.
برای جاسازی دائمی در APK، فایل‌ها را در `web/fonts/` بگذارید و در `css/font.css` یک `@font-face` با نام `Peyda` تعریف کنید.
