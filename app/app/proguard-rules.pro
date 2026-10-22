# ProGuard rules for Udayashree English School Android App
# Preserve WebView client and JavaScript interface bridges
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Android models and view holders
-keepclassmembers class * extends android.app.Activity {
    public void *(android.view.View);
}

-keep class com.udayashree.schoolapp.** { *; }
-dontwarn com.udayashree.schoolapp.**
