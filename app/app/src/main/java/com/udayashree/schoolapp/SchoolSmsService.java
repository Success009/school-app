package com.udayashree.schoolapp;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class SchoolSmsService {

    public static final String GATEWAY_BASE_URL = "https://sms.success0.com.np";
    public static final String GATEWAY_TOKEN = "Udaya@momphone";

    /**
     * Dispatch OTP code request via Gateway.
     */
    public static SchoolSmsModels.OtpSendResponse requestOtp(String phone, String template) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(GATEWAY_BASE_URL + "/api/v1/otp/send");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-Gateway-Token", GATEWAY_TOKEN);
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            SchoolSmsModels.OtpSendRequest req = new SchoolSmsModels.OtpSendRequest(phone, template);
            byte[] input = req.toJson().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            BufferedReader in = new BufferedReader(new InputStreamReader(
                    code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()
            ));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = in.readLine()) != null) {
                sb.append(line);
            }
            in.close();

            return SchoolSmsModels.OtpSendResponse.fromJson(sb.toString());
        } catch (Exception e) {
            return new SchoolSmsModels.OtpSendResponse(false, -1, 0, e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /**
     * Verify OTP code with Gateway.
     */
    public static SchoolSmsModels.OtpVerifyResponse verifyOtp(String phone, String otp) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(GATEWAY_BASE_URL + "/api/v1/otp/verify");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-Gateway-Token", GATEWAY_TOKEN);
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            SchoolSmsModels.OtpVerifyRequest req = new SchoolSmsModels.OtpVerifyRequest(phone, otp);
            byte[] input = req.toJson().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(input, 0, input.length);
            }

            int code = conn.getResponseCode();
            BufferedReader in = new BufferedReader(new InputStreamReader(
                    code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()
            ));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = in.readLine()) != null) {
                sb.append(line);
            }
            in.close();

            return SchoolSmsModels.OtpVerifyResponse.fromJson(sb.toString());
        } catch (Exception e) {
            return new SchoolSmsModels.OtpVerifyResponse(false, e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /**
     * Check cellular dispatch status of an SMS job.
     */
    public static SchoolSmsModels.JobStatusResponse checkStatus(int jobId) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(GATEWAY_BASE_URL + "/api/v1/sms/status?job_id=" + jobId);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Gateway-Token", GATEWAY_TOKEN);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int code = conn.getResponseCode();
            BufferedReader in = new BufferedReader(new InputStreamReader(
                    code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream()
            ));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = in.readLine()) != null) {
                sb.append(line);
            }
            in.close();

            return SchoolSmsModels.JobStatusResponse.fromJson(sb.toString());
        } catch (Exception e) {
            return new SchoolSmsModels.JobStatusResponse(false, jobId, "", "FAILED", e.getMessage());
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}