#!/usr/bin/env bash
# Builds a signed APK without Gradle: aapt2 -> javac -> dx -> zipalign -> apksigner.
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR="${ANDROID_JAR:-/home/claude/dl/sable/android-34/android.jar}"
BT=/usr/lib/android-sdk/build-tools/debian
OUT=build
APK_NAME="${APK_NAME:-GoalToAction-0.9.0.apk}"
KS=signing/goal-to-action-test.jks
KS_PASS=g2a-test-key

rm -rf "$OUT" && mkdir -p "$OUT"/{res,gen,classes,assets/web}

# 1) web UI as assets (the font is already embedded in css/font.css)
cp -r web/index.html web/css web/js web/img "$OUT/assets/web/"
mkdir -p "$OUT/assets/web/fonts" && cp web/fonts/Vazirmatn-OFL.txt "$OUT/assets/web/fonts/"

# 2) resources + manifest
"$BT/aapt2" compile --dir android/res -o "$OUT/res/compiled.zip"
"$BT/aapt2" link -I "$ANDROID_JAR" --manifest android/AndroidManifest.xml \
  -A "$OUT/assets" --java "$OUT/gen" --min-sdk-version 24 --target-sdk-version 34 \
  -o "$OUT/unsigned.apk" "$OUT/res/compiled.zip"

# 3) Java -> dex
javac -nowarn -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -encoding UTF-8 \
  -d "$OUT/classes" $(find android/src "$OUT/gen" -name '*.java') 2>&1 | grep -v -E "Picked up|warning|^Note" || true
dalvik-exchange --dex --min-sdk-version=24 --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && zip -q unsigned.apk classes.dex)

# 4) align + sign
mkdir -p signing
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass "$KS_PASS" -keypass "$KS_PASS" -alias g2a \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Goal-to-Action Test, O=Prototype, C=IR" 2>&1 | grep -v "Picked up" || true
fi
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
apksigner sign --ks "$KS" --ks-pass "pass:$KS_PASS" --ks-key-alias g2a --out "$OUT/$APK_NAME" "$OUT/aligned.apk" 2>&1 | grep -v "Picked up" || true
apksigner verify --print-certs "$OUT/$APK_NAME" 2>&1 | grep -v "Picked up" | head -3
ls -la "$OUT/$APK_NAME"
