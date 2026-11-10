package com.rodrigodvillar.portfolio.entity;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RepoItem(String label, String url) {}