# ProGuard rules for Udayashree English School Android App

# Preserve WebView client, WebChromeClient, and JavaScript interface bridges
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Android Activities and Views
-keepclassmembers class * extends android.app.Activity {
    public void *(android.view.View);
}

# Preserve all app classes and bridge methods
-keep class com.udayashree.schoolapp.** { *; }
-dontwarn com.udayashree.schoolapp.**

# Preserve Line Numbers for Play Console stack traces and crash diagnostics
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
