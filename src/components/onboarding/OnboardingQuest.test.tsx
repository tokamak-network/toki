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

  it("should render OnboardingQuest without error (Hook stability validation)", () => {
    render(<OnboardingQuest />);
    expect(screen.getAllByText(/Toki/i).length).toBeGreaterThan(0);
  });

  it("should not cause error when detecting login state changes (useEffect dependency validation)", async () => {
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
