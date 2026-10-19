package com.udayashree.schoolapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Iterator;

public class NotificationPollService extends Service {

    private static final String TAG = "NotificationPollService";
    private static final String CHANNEL_ID = "school_announcements_channel";
    private static final String PREFS_NAME = "school_app_prefs";
    private static final String LAST_NOTICE_KEY = "last_notice_id";
    private static final String NOTICES_URL = "https://school.success0.com.np/api/db?path=school/notices";
    private static final long POLL_INTERVAL = 300000; // 5 minutes in milliseconds

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable pollRunnable = new Runnable() {
        @Override
        public void run() {
            new Thread(new Runnable() {
                @Override
                public void run() {
                    checkForNewNotices();
                }
            }).start();
            handler.postDelayed(this, POLL_INTERVAL);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        handler.removeCallbacks(pollRunnable);
        handler.post(pollRunnable);
        return START_STICKY;
    }

    private void checkForNewNotices() {
        HttpURLConnection urlConnection = null;
        try {
                        URL url = new URL(NOTICES_URL);
            urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setRequestMethod("GET");
            urlConnection.setRequestProperty("User-Agent", "UdayashreeSchoolApp/1.0 (Android Native Background)");
            urlConnection.setConnectTimeout(10000);
            urlConnection.setReadTimeout(10000);

            int responseCode = urlConnection.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(urlConnection.getInputStream()));
                StringBuilder response = new StringBuilder();
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();

                parseAndNotify(response.toString());
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to poll notices: " + e.getMessage());
        } finally {
            if (urlConnection != null) {
                urlConnection.disconnect();
            }
        }
    }

    private void parseAndNotify(String jsonStr) {
        try {
            if (jsonStr == null || jsonStr.trim().isEmpty() || "null".equals(jsonStr)) {
                return;
            }
            JSONObject noticesObj = new JSONObject(jsonStr);
            Iterator<String> keys = noticesObj.keys();
            
            String newestId = null;
            JSONObject newestNotice = null;
            long newestTimestamp = 0;

            while (keys.hasNext()) {
                String key = keys.next();
                JSONObject notice = noticesObj.getJSONObject(key);
                long timestamp = notice.optLong("timestamp", 0);
                
                if (timestamp > newestTimestamp) {
                    newestTimestamp = timestamp;
                    newestId = key;
                    newestNotice = notice;
                }
            }

            if (newestId != null && newestNotice != null) {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String lastNoticeId = prefs.getString(LAST_NOTICE_KEY, null);

                // If we have a new notice that is different from the last notified one
                if (lastNoticeId == null || !lastNoticeId.equals(newestId)) {
                    // Save this ID as the last notified one
                    prefs.edit().putString(LAST_NOTICE_KEY, newestId).apply();

                    String title = newestNotice.optString("title", "New Announcement");
                    String content = newestNotice.optString("message", newestNotice.optString("content", "New update from school."));
                    
                    showNotification(title, content);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing notices JSON: " + e.getMessage());
        }
    }

    private void showNotification(String title, String content) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.logo)
            .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.drawable.logo))
            .setContentTitle("Udayashree English School")
            .setContentText(title + ": " + content)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(title + "\n\n" + content))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(101, builder.build());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "School Announcements";
            String description = "Notifications for important notices and updates";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(pollRunnable);
        super.onDestroy();
    }
}
