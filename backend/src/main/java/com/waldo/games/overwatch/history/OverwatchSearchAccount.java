package com.waldo.games.overwatch.history;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
record OverwatchSearchAccount(
        String url,
        String name,
        String namecard,
        String avatar) {
}
