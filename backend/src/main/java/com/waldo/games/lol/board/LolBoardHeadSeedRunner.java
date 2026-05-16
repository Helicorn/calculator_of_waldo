package com.waldo.games.lol.board;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * H2·Oracle 등 빈 DB에서 말머리 마스터 행을 채웁니다. 이미 있으면 건너뜁니다.
 */
@Component
@Order(50)
public class LolBoardHeadSeedRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LolBoardHeadSeedRunner.class);

    private final LolBoardHeadRepository headRepository;

    public LolBoardHeadSeedRunner(LolBoardHeadRepository headRepository) {
        this.headRepository = headRepository;
    }

    @Override
    public void run(String... args) {
        if (headRepository.count() > 0) {
            return;
        }
        seed("일반", 10);
        seed("질문", 20);
        seed("팁", 30);
        seed("잡담", 40);
        log.info("Seeded {} LOL_BOARD_HEAD rows", headRepository.count());
    }

    private void seed(String label, int sortOrder) {
        LolBoardHeadEntity h = new LolBoardHeadEntity();
        h.setLabel(label);
        h.setSortOrder(sortOrder);
        headRepository.save(h);
    }
}
