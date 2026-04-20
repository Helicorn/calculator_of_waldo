package com.waldo;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {

    @Test
    void hashThenMatches() {
        String hash = PasswordHasher.hash("secret123");
        assertTrue(PasswordHasher.matches("secret123", hash));
        assertFalse(PasswordHasher.matches("wrong", hash));
    }

    @Test
    void matchesReturnsFalseForNullOrBlankStored() {
        assertFalse(PasswordHasher.matches("x", null));
        assertFalse(PasswordHasher.matches("x", ""));
        assertFalse(PasswordHasher.matches("x", "   "));
    }

    @Test
    void needsUpgradeForLegacySha256Hex() {
        String shaHex =
                "e7cf3ef4f17c3999a94f2c6f612e8a888e5b1026878e4e19398b23bd38ec221a";
        assertTrue(PasswordHasher.needsUpgrade(shaHex));
    }

    @Test
    void needsUpgradeFalseForBcrypt() {
        String bcrypt = PasswordHasher.hash("pw");
        assertFalse(PasswordHasher.needsUpgrade(bcrypt));
    }
}
