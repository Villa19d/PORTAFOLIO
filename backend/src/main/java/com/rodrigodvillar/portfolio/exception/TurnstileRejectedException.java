package com.rodrigodvillar.portfolio.exception;

public class TurnstileRejectedException extends RuntimeException {

    public TurnstileRejectedException(String reason) {
        super(reason);
    }
}
