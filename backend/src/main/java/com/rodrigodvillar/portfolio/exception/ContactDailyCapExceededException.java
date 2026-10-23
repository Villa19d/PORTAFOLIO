package com.rodrigodvillar.portfolio.exception;

public class ContactDailyCapExceededException extends RuntimeException {

    private final long retryAfterSeconds;

    public ContactDailyCapExceededException(long retryAfterSeconds) {
        super("contact_daily_cap_exceeded");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
