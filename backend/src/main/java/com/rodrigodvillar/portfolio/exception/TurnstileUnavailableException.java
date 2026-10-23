package com.rodrigodvillar.portfolio.exception;

public class TurnstileUnavailableException extends RuntimeException {

    public TurnstileUnavailableException(String reason, Throwable cause) {
        super(reason, cause);
    }
}
