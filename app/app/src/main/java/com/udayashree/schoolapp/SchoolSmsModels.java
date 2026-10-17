package com.udayashree.schoolapp;

import org.json.JSONObject;

public class SchoolSmsModels {

    public static class OtpSendRequest {
        public final String phone;
        public final String template;

        public OtpSendRequest(String phone, String template) {
            this.phone = phone;
            this.template = template;
        }

        public OtpSendRequest(String phone) {
            this(phone, null);
        }

        public String toJson() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("phone", phone);
                if (template != null) {
                    obj.put("template", template);
                }
                return obj.toString();
            } catch (Exception e) {
                return "{\"phone\":\"" + phone + "\"}";
            }
        }
    }

    public static class OtpSendResponse {
        public final boolean success;
        public final int smsJobId;
        public final int expiresInSeconds;
        public final String message;

        public OtpSendResponse(boolean success, int smsJobId, int expiresInSeconds, String message) {
            this.success = success;
            this.smsJobId = smsJobId;
            this.expiresInSeconds = expiresInSeconds;
            this.message = message;
        }

        public static OtpSendResponse fromJson(String jsonStr) {
            try {
                JSONObject obj = new JSONObject(jsonStr);
                boolean success = obj.optBoolean("success", false);
                int jobId = obj.optInt("sms_job_id", -1);
                int expires = obj.optInt("expires_in_seconds", 300);
                String msg = obj.optString("message", obj.optString("error", ""));
                return new OtpSendResponse(success, jobId, expires, msg);
            } catch (Exception e) {
                return new OtpSendResponse(false, -1, 0, e.getMessage());
            }
        }
    }

    public static class OtpVerifyRequest {
        public final String phone;
        public final String otp;

        public OtpVerifyRequest(String phone, String otp) {
            this.phone = phone;
            this.otp = otp;
        }

        public String toJson() {
            try {
                JSONObject obj = new JSONObject();
                obj.put("phone", phone);
                obj.put("otp", otp);
                return obj.toString();
            } catch (Exception e) {
                return "{\"phone\":\"" + phone + "\",\"otp\":\"" + otp + "\"}";
            }
        }
    }

    public static class OtpVerifyResponse {
        public final boolean success;
        public final String message;

        public OtpVerifyResponse(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public static OtpVerifyResponse fromJson(String jsonStr) {
            try {
                JSONObject obj = new JSONObject(jsonStr);
                boolean success = obj.optBoolean("success", false);
                String msg = obj.optString("message", obj.optString("error", ""));
                return new OtpVerifyResponse(success, msg);
            } catch (Exception e) {
                return new OtpVerifyResponse(false, e.getMessage());
            }
        }
    }

    public static class JobStatusResponse {
        public final boolean success;
        public final int id;
        public final String phone;
        public final String status;
        public final String errorReason;

        public JobStatusResponse(boolean success, int id, String phone, String status, String errorReason) {
            this.success = success;
            this.id = id;
            this.phone = phone;
            this.status = status;
            this.errorReason = errorReason;
        }

        public static JobStatusResponse fromJson(String jsonStr) {
            try {
                JSONObject obj = new JSONObject(jsonStr);
                boolean success = obj.optBoolean("success", false);
                JSONObject job = obj.optJSONObject("job");
                if (job != null) {
                    return new JobStatusResponse(
                            success,
                            job.optInt("id", -1),
                            job.optString("phone", ""),
                            job.optString("status", "UNKNOWN"),
                            job.optString("error_reason", null)
                    );
                }
                return new JobStatusResponse(success, -1, "", "UNKNOWN", null);
            } catch (Exception e) {
                return new JobStatusResponse(false, -1, "", "FAILED", e.getMessage());
            }
        }
    }
}