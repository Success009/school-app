package com.udayashree.schoolapp;

import org.junit.Test;
import static org.junit.Assert.*;

public class SecurityUtilsTest {

    @Test
    public void testSafeUrlAllowed() {
        assertTrue(SecurityUtils.isSafeUrl("https://school.success0.com.np/"));
        assertTrue(SecurityUtils.isSafeUrl("https://school.success0.com.np/admin.html"));
        assertTrue(SecurityUtils.isSafeUrl("https://school.success0.com.np/teacher.html"));
        assertTrue(SecurityUtils.isSafeUrl("https://school.success0.com.np/parent.html"));
        assertTrue(SecurityUtils.isSafeUrl("file:///android_asset/offline/index.html"));
        assertTrue(SecurityUtils.isSafeUrl("tel:9809248510"));
        assertTrue(SecurityUtils.isSafeUrl("mailto:school@example.com"));
    }

    @Test
    public void testUnsafeUrlRejected() {
        assertFalse(SecurityUtils.isSafeUrl(null));
        assertFalse(SecurityUtils.isSafeUrl(""));
        assertFalse(SecurityUtils.isSafeUrl("http://school.success0.com.np")); // HTTP rejected
        assertFalse(SecurityUtils.isSafeUrl("https://malicious-phishing.com/school"));
        assertFalse(SecurityUtils.isSafeUrl("javascript:alert(1)"));
    }
}