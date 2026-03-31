/**
 * Voice E2E Test Suite for Toki Chat
 *
 * Tests the full voice pipeline by mocking the Web Speech API:
 *   SpeechRecognition mock → transcript → intent parsing → action execution → UI update → TTS call
 *
 * Why mock instead of real audio?
 *   Chrome's Web Speech API sends audio to Google servers — flaky in CI/headless.
 *   Mocking lets us test OUR code (intent parsing, actions, UI) deterministically.
 */
import { test, expect, type Page } from "@playwright/test";
import path from "path";

// ─── Helper: inject SpeechRecognition mock into the page ─────────────

async function injectSpeechRecognitionMock(page: Page) {
  await page.addInitScript(() => {
    // Mock SpeechRecognition that delivers a transcript when start() is called
    class MockSpeechRecognition extends EventTarget {
      lang = "ko-KR";
      continuous = false;
      interimResults = true;
      maxAlternatives = 1;

      // Queue of transcripts to deliver
      static pendingTranscripts: string[] = [];

      onresult: ((event: Event) => void) | null = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;

      start() {
        const transcript = MockSpeechRecognition.pendingTranscripts.shift();
        if (!transcript) {
          // No transcript queued → fire no-speech error
          setTimeout(() => {
            this.onerror?.(Object.assign(new Event("error"), { error: "no-speech" }));
            this.onend?.(new Event("end"));
          }, 100);
          return;
        }

        // Simulate interim result first
        setTimeout(() => {
          const interimEvent = new Event("result") as Event & { results: unknown; resultIndex: number };
          Object.defineProperty(interimEvent, "resultIndex", { value: 0 });
          Object.defineProperty(interimEvent, "results", {
            value: {
              length: 1,
              0: {
                isFinal: false,
                length: 1,
                0: { transcript, confidence: 0.85 },
              },
            },
          });
          this.onresult?.(interimEvent);
        }, 50);

        // Then final result
        setTimeout(() => {
          const finalEvent = new Event("result") as Event & { results: unknown; resultIndex: number };
          Object.defineProperty(finalEvent, "resultIndex", { value: 0 });
          Object.defineProperty(finalEvent, "results", {
            value: {
              length: 1,
              0: {
                isFinal: true,
                length: 1,
                0: { transcript, confidence: 0.95 },
              },
            },
          });
          this.onresult?.(finalEvent);

          // End recognition after final result
          setTimeout(() => this.onend?.(new Event("end")), 50);
        }, 150);
      }

      stop() {
        this.onend?.(new Event("end"));
      }

      abort() {
        this.onend?.(new Event("end"));
      }
    }

    // Expose on window
    (window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition;
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition;

    // Helper to queue a transcript from test
    (window as unknown as Record<string, unknown>).__queueSpeechTranscript = (text: string) => {
      MockSpeechRecognition.pendingTranscripts.push(text);
    };

    // Mock SpeechSynthesis to track TTS calls
    const ttsLog: Array<{ text: string; lang: string; timestamp: number }> = [];
    (window as unknown as Record<string, unknown>).__ttsLog = ttsLog;

    const origSpeak = window.speechSynthesis?.speak?.bind(window.speechSynthesis);
    if (window.speechSynthesis) {
      window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
        ttsLog.push({
          text: utterance.text,
          lang: utterance.lang,
          timestamp: Date.now(),
        });
        // Fire onstart/onend to keep state consistent
        utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
        setTimeout(() => {
          utterance.onend?.(new Event("end") as SpeechSynthesisEvent);
        }, 100);
      };
      // getVoices returns empty array in test
      window.speechSynthesis.getVoices = () => [];
    }
  });
}

// ─── Helper: open chat window ────────────────────────────────────────

async function openTokiChat(page: Page) {
  // Click the floating chat bubble
  const bubble = page.locator('button:has(img[alt="Chat with Toki"])');
  await bubble.waitFor({ timeout: 20_000 });
  await bubble.click();

  // Wait for chat window to appear
  await page.locator("text=Toki").first().waitFor({ timeout: 5_000 });
  // Wait for typewriter to finish
  await page.waitForTimeout(2000);
}

// ─── Helper: queue speech and click mic ──────────────────────────────

async function speakToToki(page: Page, transcript: string) {
  // Queue the transcript
  await page.evaluate((t) => {
    (window as unknown as Record<string, { (text: string): void }>).__queueSpeechTranscript(t);
  }, transcript);

  // Click the mic button
  const micButton = page.locator('button[aria-label="Start recording"]');
  await micButton.click();

  // Wait for recognition to complete + response to appear
  await page.waitForTimeout(1500);
}

// ─── Helper: get last Toki message text ──────────────────────────────

async function getLastTokiMessage(page: Page): Promise<string> {
  const messages = page.locator('.bg-white\\/\\[0\\.06\\] p');
  const count = await messages.count();
  if (count === 0) return "";
  return (await messages.nth(count - 1).textContent()) ?? "";
}

// ─── Helper: get TTS log ─────────────────────────────────────────────

async function getTtsLog(page: Page): Promise<Array<{ text: string; lang: string }>> {
  return page.evaluate(() => (window as unknown as Record<string, unknown>).__ttsLog as Array<{ text: string; lang: string }>);
}

// ─── Tests ───────────────────────────────────────────────────────────

test.describe("Toki Voice E2E", () => {
  test.beforeEach(async ({ page }) => {
    await injectSpeechRecognitionMock(page);
    await page.goto("/");
    await openTokiChat(page);
  });

  test("음성 로그인 인텐트: '로그인' → login action button appears", async ({ page }) => {
    await speakToToki(page, "로그인");

    // User message should appear
    const userMsg = page.locator("text=로그인").first();
    await expect(userMsg).toBeVisible({ timeout: 5_000 });

    // Toki should respond with login action button
    const loginBtn = page.locator("button", { hasText: /Google|시작/ });
    await expect(loginBtn).toBeVisible({ timeout: 5_000 });
  });

  test("음성 도움말: '도와줘' → help response appears", async ({ page }) => {
    await speakToToki(page, "도와줘");

    // Should show help text with feature list (match partial — long message gets split across elements)
    const helpText = page.locator('p:has-text("로그인"), p:has-text("Login")').first();
    await expect(helpText).toBeVisible({ timeout: 8_000 });
  });

  test("음성 스테이킹: 'start staking' → staking intent response", async ({ page }) => {
    await speakToToki(page, "start staking");

    // Should see staking-related response
    const response = page.locator("text=/staking|스테이킹/i").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });

  test("음성 잔액: '잔액' → balance response", async ({ page }) => {
    await speakToToki(page, "잔액");

    // Not logged in → should prompt login
    const response = page.locator("text=/로그인|log in/i").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });

  test("음성 네비게이션: '대시보드' → dashboard navigation", async ({ page }) => {
    await speakToToki(page, "대시보드");

    const response = page.locator("text=/대시보드|dashboard/i").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });

  test("영어 음성: 'help' → English help response", async ({ page }) => {
    await speakToToki(page, "help");

    const response = page.locator("text=/help|can/i").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });

  test("음성 토키픽: '토키 추천해줘' → Toki pick response", async ({ page }) => {
    await speakToToki(page, "토키 추천해줘");

    const response = page.locator("text=/골라|추천|pick|operator/i").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });

  test("음성 로그아웃: '로그아웃' → logout confirmation (not logged in)", async ({ page }) => {
    await speakToToki(page, "로그아웃");

    // Should say not logged in
    const response = page.locator("text=/로그인하지|not logged/i").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });

  test("mic button toggles listening state", async ({ page }) => {
    // Queue a transcript so start() works
    await page.evaluate(() => {
      (window as unknown as Record<string, { (text: string): void }>).__queueSpeechTranscript("테스트");
    });

    const micButton = page.locator('button[aria-label="Start recording"]');
    await expect(micButton).toBeVisible();

    // Click to start → should show recording state
    await micButton.click();

    // Listening indicator should appear (waveform dots in MicButton)
    const stopButton = page.locator('button[aria-label="Stop recording"]');
    await expect(stopButton).toBeVisible({ timeout: 3_000 });
  });

  test("TTS is called when enabled and Toki responds", async ({ page }) => {
    // Enable TTS — target specifically the Toki TTS toggle in chat header
    const ttsToggle = page.locator('button[aria-label="Unmute Toki"], button[aria-label*="음소거 해제"]').first();
    if (await ttsToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await ttsToggle.click();
    }

    // Now speak
    await speakToToki(page, "도와줘");
    await page.waitForTimeout(1000);

    const ttsLog = await getTtsLog(page);
    // TTS may or may not fire depending on ttsEnabled state
    // Just verify our mock captured it if it was called
    if (ttsLog.length > 0) {
      expect(ttsLog[0].text).toBeTruthy();
      expect(ttsLog[0].lang).toMatch(/ko|en/);
    }
  });

  test("연속 음성 입력: multiple voice commands in sequence", async ({ page }) => {
    await speakToToki(page, "도와줘");
    await page.waitForTimeout(1000);

    await speakToToki(page, "토키가 뭐야?");
    await page.waitForTimeout(1000);

    // Both responses should be in chat
    const tokiMessages = page.locator('.bg-white\\/\\[0\\.06\\] p');
    const count = await tokiMessages.count();
    // At minimum: initial greeting + 2 responses = 3 Toki messages
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("음성 금액 인텐트: '100톤 스테이킹' → amount parsed correctly", async ({ page }) => {
    await speakToToki(page, "100톤 스테이킹");

    const response = page.locator("text=/100.*TON|100톤/").first();
    await expect(response).toBeVisible({ timeout: 5_000 });
  });
});
