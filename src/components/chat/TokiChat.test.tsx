import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TokiChat from "./TokiChat";

describe("TokiChat Regression Test", () => {
  it("should open chat window and type dialogue when icon is clicked", async () => {
    render(<TokiChat />);
    
    // 1. Check icon in initial state
    const icon = screen.getByAltText(/Chat with Toki/i);
    expect(icon).toBeInTheDocument();
    
    // 2. Click to open chat window
    fireEvent.click(icon);
    
    // 3. Verify Toki name and initial text appear
    const tokiNames = screen.getAllByText("Toki");
    expect(tokiNames.length).toBeGreaterThan(0);
    
    // Check if part of the text appears (ko locale default)
    expect(await screen.findByText(/안녕! 나는 토키야/i)).toBeInTheDocument();
  });

  it("should show choice buttons after typing is complete (handleTypingComplete validation)", async () => {
    vi.useFakeTimers();
    render(<TokiChat />);
    
    // Open chat window
    fireEvent.click(screen.getByAltText(/Chat with Toki/i));
    
    // Wait for dialogue typing time
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Check if one of the choice buttons appears
    expect(screen.getByText(/스테이킹이 뭐야/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it("should render without error even when switching dialogue nodes (Hook call order stability validation)", async () => {
    vi.useFakeTimers();
    render(<TokiChat />);
    
    fireEvent.click(screen.getByAltText(/Chat with Toki/i));
    
    // Click 'Tell me about APR' after typing is complete
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    const choice = screen.getByText(/수익률 알려줘/i);
    fireEvent.click(choice);

    // Wait for dialogue typing time after node change
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Verify new text appears without Hook error after node change
    expect(screen.getByText(/현재 시뇨리지 APR은/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });
});
