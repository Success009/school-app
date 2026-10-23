package com.udayashree.schoolapp;

import android.Manifest;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.DownloadListener;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private LinearLayout offlineLayout;
    private Button retryButton;
    private static final String TARGET_URL = "https://school.success0.com.np/";

    // Standard Android file picker callback
    private ValueCallback<Uri[]> filePathCallback;
    private ActivityResultLauncher<Intent> filePickerLauncher;
    private ActivityResultLauncher<String> notificationPermissionLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        offlineLayout = findViewById(R.id.offline_layout);
        retryButton = findViewById(R.id.retry_button);

        // 1. Zero-permission file chooser launcher
        filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (filePathCallback != null) {
                    Uri[] results = null;
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Intent data = result.getData();
                        if (data.getData() != null) {
                            results = new Uri[]{ data.getData() };
                        } else if (data.getClipData() != null) {
                            int count = data.getClipData().getItemCount();
                            results = new Uri[count];
                            for (int i = 0; i < count; i++) {
                                results[i] = data.getClipData().getItemAt(i).getUri();
                            }
                        }
                    }
                    filePathCallback.onReceiveValue(results);
                    filePathCallback = null;
                }
            }
        );

        // 2. On-demand notification permission launcher (Only triggered when web app requests it or when enabled)
        notificationPermissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            isGranted -> {
                if (isGranted) {
                    startNotificationService();
                }
            }
        );

        // Configure hardened WebView settings
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadsImagesAutomatically(true);

        // Platform identification tag
        String defaultUa = webSettings.getUserAgentString();
        webSettings.setUserAgentString(defaultUa + " UdayashreeSchoolApp/1.0 (Android Native)");

        // Security Hardening:
        // 1. NEVER allow mixed HTTP content over HTTPS
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        // 2. Disable local filesystem and content scheme traversal
        webSettings.setAllowFileAccess(false);
        webSettings.setAllowContentAccess(false);
        webSettings.setGeolocationEnabled(false);

        // 3. Intelligent cache mode: cache offline, network online
        if (isOnline()) {
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }

        // WebChromeClient: Enables standard Android file picker for <input type="file">
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = callback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);

                // Support document types specified in web input accept attribute
                String[] acceptTypes = params != null ? params.getAcceptTypes() : null;
                if (acceptTypes != null && acceptTypes.length > 0 && !acceptTypes[0].isEmpty()) {
                    intent.setType(acceptTypes[0]);
                    if (acceptTypes.length > 1) {
                        intent.putExtra(Intent.EXTRA_MIME_TYPES, acceptTypes);
                    }
                } else {
                    intent.setType("*/*");
                }

                if (params != null && params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) {
                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                }

                try {
                    filePickerLauncher.launch(Intent.createChooser(intent, "Select File"));
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });

        // DownloadListener: Enables PDF report card and marksheet downloads
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimeType);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading school document...");
                    String filename = URLUtil.guessFileName(url, contentDisposition, mimeType);
                    request.setTitle(filename);
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);

                    DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                    if (dm != null) {
                        dm.enqueue(request);
                        Toast.makeText(MainActivity.this, "Downloading " + filename + "...", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    // Fallback to external browser / viewer if DownloadManager fails
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                }
            }
        });

        // Safe JavaScript Bridge: Exposes native utilities without dangerous capabilities
        webView.addJavascriptInterface(new WebAppBridge(this), "AndroidAppBridge");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (!isOnline()) {
                    showOfflineView();
                }
            }
        });

        retryButton.setOnClickListener(v -> checkAndLoad());

        checkAndLoad();

        // Start notification service if permission is already granted (or if below Android 13)
        checkAndStartNotificationService();
    }

    private void checkAndLoad() {
        WebSettings webSettings = webView.getSettings();
        if (isOnline()) {
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            offlineLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl(TARGET_URL);
        } else {
            webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
            offlineLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl(TARGET_URL);
        }
    }

    private void showOfflineView() {
        webView.setVisibility(View.GONE);
        offlineLayout.setVisibility(View.VISIBLE);
    }

    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm != null) {
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        }
        return false;
    }

    public void checkAndStartNotificationService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                startNotificationService();
            }
            // If not granted, we do NOT spam the user on startup; it is requested on demand via WebAppBridge
        } else {
            startNotificationService();
        }
    }

    public void requestNotificationPermissionOnDemand() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
    }

    private void startNotificationService() {
        Intent serviceIntent = new Intent(this, NotificationPollService.class);
        startService(serviceIntent);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    /**
     * Safe bidirectional bridge exposed to window.AndroidAppBridge
     */
    public class WebAppBridge {
        private final Context context;

        WebAppBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String getPlatform() {
            return "android_app";
        }

        @JavascriptInterface
        public int getVersionCode() {
            return 2;
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            runOnUiThread(MainActivity.this::requestNotificationPermissionOnDemand);
        }

        @JavascriptInterface
        public void showToast(String message) {
            if (message != null && !message.isEmpty()) {
                runOnUiThread(() -> Toast.makeText(context, message, Toast.LENGTH_SHORT).show());
            }
        }

        @JavascriptInterface
        public void shareText(String title, String text) {
            if (text != null && !text.isEmpty()) {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.putExtra(Intent.EXTRA_TEXT, text);
                sendIntent.setType("text/plain");
                Intent shareIntent = Intent.createChooser(sendIntent, title != null ? title : "Share");
                shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(shareIntent);
            }
        }

        @JavascriptInterface
        public void triggerPollCheck() {
            startNotificationService();
        }
    }
}
