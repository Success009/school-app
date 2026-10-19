package com.udayashree.schoolapp;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private LinearLayout offlineLayout;
    private Button retryButton;
    private static final String TARGET_URL = "https://school.success0.com.np/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        offlineLayout = findViewById(R.id.offline_layout);
        retryButton = findViewById(R.id.retry_button);

                // Configure hardened WebView settings for security and offline caching
                WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setLoadsImagesAutomatically(true);

        // Append custom client tag to recognize native mobile app client
        String defaultUa = webSettings.getUserAgentString();
        webSettings.setUserAgentString(defaultUa + " UdayashreeSchoolApp/1.0 (Android Native)");

        // SECURITY HARDENING:
        // 1. NEVER allow mixed content (HTTP assets over HTTPS) to eliminate MitM injection
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        }
        // 2. Disable local file scheme and content access to prevent local sandbox exfiltration
        webSettings.setAllowFileAccess(false);
        webSettings.setAllowContentAccess(false);
        webSettings.setGeolocationEnabled(false);

        // 3. Intelligent cache strategy: prioritize cache if offline, network if online
        if (isOnline()) {
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                // If offline and no cache exists, display offline fallback layout
                if (!isOnline()) {
                    showOfflineView();
                }
            }
        });

        retryButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                checkAndLoad();
            }
        });

        checkAndLoad();

        // Start background notification poll service
        startNotificationService();
    }

    private void checkAndLoad() {
        WebSettings webSettings = webView.getSettings();
        if (isOnline()) {
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            offlineLayout.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl(TARGET_URL);
        } else {
            // Attempt to load from cache so parents/teachers can view previously loaded records
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
}
