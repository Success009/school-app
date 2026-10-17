package com.udayashree.schoolapp;

import org.junit.Test;
import static org.junit.Assert.*;

public class SchoolSmsModelsTest {

    @Test
    public void testOtpSendRequestJson() {
        SchoolSmsModels.OtpSendRequest req = new SchoolSmsModels.OtpSendRequest("9809248510", "Your code is {otp}");
        String json = req.toJson();
        assertTrue(json.contains("\"phone\":\"9809248510\""));
        assertTrue(json.contains("\"template\":\"Your code is {otp}\""));
    }

    @Test
    public void testOtpSendResponseParsing() {
        String json = "{\"success\":true,\"sms_job_id\":42,\"expires_in_seconds\":300}";
        SchoolSmsModels.OtpSendResponse res = SchoolSmsModels.OtpSendResponse.fromJson(json);
        assertTrue(res.success);
        assertEquals(42, res.smsJobId);
        assertEquals(300, res.expiresInSeconds);
    }

    @Test
    public void testOtpVerifyRequestAndResponse() {
        SchoolSmsModels.OtpVerifyRequest req = new SchoolSmsModels.OtpVerifyRequest("9809248510", "245510");
        String json = req.toJson();
        assertTrue(json.contains("\"phone\":\"9809248510\""));
        assertTrue(json.contains("\"otp\":\"245510\""));

        String successJson = "{\"success\":true,\"message\":\"OTP verified successfully.\"}";
        SchoolSmsModels.OtpVerifyResponse res = SchoolSmsModels.OtpVerifyResponse.fromJson(successJson);
        assertTrue(res.success);
        assertEquals("OTP verified successfully.", res.message);
    }

    @Test
    public void testJobStatusResponse() {
        String json = "{\"success\":true,\"job\":{\"id\":42,\"phone\":\"9809248510\",\"status\":\"SENT\",\"error_reason\":null}}";
        SchoolSmsModels.JobStatusResponse res = SchoolSmsModels.JobStatusResponse.fromJson(json);
        assertTrue(res.success);
        assertEquals(42, res.id);
        assertEquals("9809248510", res.phone);
        assertEquals("SENT", res.status);
        assertNull(res.errorReason);
    }
}