package com.udayashree.schoolapp;

import java.net.URI;

public class SecurityUtils {

    public static final String PRIMARY_HOST = "school.success0.com.np";
    public static final String PRIMARY_URL = "https://school.success0.com.np/";
    public static final String OFFLINE_URL = "file:///android_asset/offline/index.html";

    public static boolean isSafeUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }

        // Allow internal bundled offline assets
        if (url.startsWith("file:///android_asset/")) {
            return true;
        }

        // Allow tel: and mailto: intents
        if (url.startsWith("tel:") || url.startsWith("mailto:")) {
            return true;
        }

        try {
            URI uri = new URI(url);
            String host = uri.getHost();
            String scheme = uri.getScheme();

            if (!"https".equalsIgnoreCase(scheme)) {
                return false;
            }

            return PRIMARY_HOST.equalsIgnoreCase(host);
        } catch (Exception e) {
            return false;
        }
    }
}