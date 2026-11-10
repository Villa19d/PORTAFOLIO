package com.rodrigodvillar.portfolio.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = ValidMediaValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.METHOD, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidMedia {
    String message() default "Invalid media list";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}