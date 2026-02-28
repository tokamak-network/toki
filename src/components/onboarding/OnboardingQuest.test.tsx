import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React, { useEffect } from "react";
import OnboardingQuest from "./OnboardingQuest";
import * as privyAuth from "@privy-io/react-auth";

// Mock Privy authentication
const mockLogin = vi.fn();
const mockExportWallet = vi.fn();

vi.mock("@privy-io/react-auth", () => ({
  usePrivy: () => ({
    ready: true,
    authenticated: false,
    login: mockLogin,
    logout: vi.fn(),
    user: null,
    exportWallet: mockExportWallet,
  }),
  useWallets: () => ({
    wallets: [],
  }),
  toViemAccount: vi.fn(),
}));

describe("OnboardingQuest Regression Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("OnboardingQuest가 에러 없이 렌더링되어야 한다 (Hook 안정성 검증)", () => {
    render(<OnboardingQuest />);
    expect(screen.getAllByText(/Toki/i).length).toBeGreaterThan(0);
  });

  it("로그인 상태 변화 감지 로직이 에러를 유발하지 않아야 한다 (useEffect 의존성 검증)", async () => {
    const { rerender } = render(<OnboardingQuest />);

    vi.spyOn(privyAuth, 'usePrivy').mockReturnValue({
      ready: true,
      authenticated: true,
      login: mockLogin,
      logout: vi.fn(),
      user: { wallet: { address: '0x123' } } as any,
      exportWallet: mockExportWallet,
    });

    rerender(<OnboardingQuest />);
    
    expect(screen.getAllByText(/Toki/i).length).toBeGreaterThan(0);
  });
});
