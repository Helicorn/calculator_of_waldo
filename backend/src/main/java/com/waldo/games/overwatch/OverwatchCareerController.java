package com.waldo.games.overwatch;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 오버워치 career 페이지 기반 전적 조회.
 *
 * <p>예: {@code GET /api/waldo/games/overwatch/career?name=...&tag=...}
 */
@RestController
@RequestMapping("/api/waldo/games/overwatch")
public class OverwatchCareerController {

    private final OverwatchCareerService careerService;

    public OverwatchCareerController(OverwatchCareerService careerService) {
        this.careerService = careerService;
    }

    /**
     * career URL만 Blizzard에 요청해 HTTP·리다이렉트·HTML 종류를 검증합니다 (파싱 없음).
     *
     * <p>예: {@code GET .../career/probe?query=https://overwatch.blizzard.com/ko-kr/career/.../}
     */
    @GetMapping("/career/probe")
    public ResponseEntity<OverwatchCareerProbeResponse> careerProbe(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(careerService.probeCareerFetch(query, name, tag));
    }

    /**
     * @param name 배틀태그 닉네임
     * @param tag 배틀태그 숫자(#{@code 1234}의 {@code 1234})
     * @param query 선택: {@code 닉네임#태그} 한 줄, career URL, 프로필 ID(개발·디버그용)
     * @param debug {@code true}이면 {@link OverwatchCareerDebug} 포함
     */
    @GetMapping("/career")
    public ResponseEntity<OverwatchCareerResponse> career(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "false") boolean debug) {
        return ResponseEntity.ok(careerService.fetchCareer(query, name, tag, debug));
    }
}
