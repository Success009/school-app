package com.udayashree.schoolapp;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class NotificationHelper {

    public static final String CHANNEL_ANNOUNCEMENTS = "school_announcements_channel";
    public static final String CHANNEL_EMERGENCY = "school_emergency_channel";
    public static final int NOTIFICATION_ID_BASE = 1001;

    public static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = context.getSystemService(NotificationManager.class);
            if (manager == null) return;

            // Channel 1: Announcements
            NotificationChannel annChannel = new NotificationChannel(
                    CHANNEL_ANNOUNCEMENTS,
                    "School Announcements",
                    NotificationManager.IMPORTANCE_HIGH
            );
            annChannel.setDescription("Important notifications, homework, and event announcements");
            annChannel.enableVibration(true);

            // Channel 2: Emergency / Alerts
            NotificationChannel emergChannel = new NotificationChannel(
                    CHANNEL_EMERGENCY,
                    "Urgent School Alerts",
                    NotificationManager.IMPORTANCE_MAX
            );
            emergChannel.setDescription("Emergency weather closures and critical notifications");
            emergChannel.enableVibration(true);

            manager.createNotificationChannel(annChannel);
            manager.createNotificationChannel(emergChannel);
        }
    }

    public static void showNotification(Context context, String title, String message, boolean isEmergency) {
        // Guard against posting without runtime permission on Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) 
                    != PackageManager.PERMISSION_GRANTED) {
                return;
            }
        }

        String channelId = isEmergency ? CHANNEL_EMERGENCY : CHANNEL_ANNOUNCEMENTS;

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(R.drawable.logo)
                .setLargeIcon(BitmapFactory.decodeResource(context.getResources(), R.drawable.logo))
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setPriority(isEmergency ? NotificationCompat.PRIORITY_MAX : NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true);

        NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
        int notificationId = (int) (System.currentTimeMillis() % Integer.MAX_VALUE);
        notificationManager.notify(notificationId, builder.build());
    }
}