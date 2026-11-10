package com.rodrigodvillar.portfolio.validation;

import com.rodrigodvillar.portfolio.dto.MediaItemDto;
import com.rodrigodvillar.portfolio.entity.MediaType;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ValidMediaValidator implements ConstraintValidator<ValidMedia, List<MediaItemDto>> {

    public static final int MAX_IMAGES = 10;
    public static final int MAX_VIDEOS = 5;

    private static final Set<String> YOUTUBE_HOSTS = Set.of(
            "youtube.com", "www.youtube.com", "youtu.be",
            "youtube-nocookie.com", "www.youtube-nocookie.com");
    private static final Pattern VIDEO_ID = Pattern.compile("^[A-Za-z0-9_-]{6,20}$");
    private static final Pattern EMBED_PATH = Pattern.compile("^/(?:embed|shorts)/([^/]+)$");

    @Override
    public boolean isValid(List<MediaItemDto> items, ConstraintValidatorContext context) {
        if (items == null) {
            return true;
        }
        int images = 0;
        int videos = 0;
        for (MediaItemDto item : items) {
            if (item == null || item.type() == null || item.url() == null) {
                continue; // reported by the element constraints
            }
            if (item.type() == MediaType.IMAGE) {
                images++;
            } else {
                videos++;
                if (!isYoutubeUrl(item.url())) {
                    return reject(context, "YOUTUBE items must be valid https YouTube video links");
                }
            }
        }
        if (images > MAX_IMAGES) {
            return reject(context, "At most " + MAX_IMAGES + " images are allowed");
        }
        if (videos > MAX_VIDEOS) {
            return reject(context, "At most " + MAX_VIDEOS + " videos are allowed");
        }
        return true;
    }

    static boolean isYoutubeUrl(String raw) {
        try {
            URI uri = URI.create(raw);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
                return false;
            }
            String host = uri.getHost().toLowerCase(Locale.ROOT);
            if (!YOUTUBE_HOSTS.contains(host)) {
                return false;
            }
            String path = uri.getPath() == null ? "" : uri.getPath();
            String id = null;
            if (host.equals("youtu.be")) {
                String[] segments = path.split("/");
                for (String segment : segments) {
                    if (!segment.isBlank()) {
                        id = segment;
                        break;
                    }
                }
            } else if (path.equals("/watch")) {
                id = queryParam(uri.getRawQuery(), "v");
            } else {
                Matcher matcher = EMBED_PATH.matcher(path);
                if (matcher.matches()) {
                    id = matcher.group(1);
                }
            }
            return id != null && VIDEO_ID.matcher(id).matches();
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String queryParam(String rawQuery, String name) {
        if (rawQuery == null) {
            return null;
        }
        for (String pair : rawQuery.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && pair.substring(0, eq).equals(name)) {
                return pair.substring(eq + 1);
            }
        }
        return null;
    }

    private static boolean reject(ConstraintValidatorContext context, String message) {
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }
}