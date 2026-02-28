import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TokiChat from "./TokiChat";

describe("TokiChat Regression Test", () => {
  it("아이콘 클릭 시 채팅창이 열리고 다이얼로그가 타이핑된다", async () => {
    render(<TokiChat />);
    
    // 1. 초기 상태에서 아이콘 확인
    const icon = screen.getByAltText(/Chat with Toki/i);
    expect(icon).toBeInTheDocument();
    
    // 2. 클릭하여 채팅창 열기
    fireEvent.click(icon);
    
    // 3. Toki 이름과 초기 텍스트가 나타나는지 확인
    const tokiNames = screen.getAllByText("Toki");
    expect(tokiNames.length).toBeGreaterThan(0);
    
    // 텍스트 일부가 나타나는지 확인 (ko 로케일 기본값)
    expect(await screen.findByText(/안녕! 나는 토키야/i)).toBeInTheDocument();
  });

  it("타이핑이 완료되면 선택지 버튼이 나타나야 한다 (handleTypingComplete 검증)", async () => {
    vi.useFakeTimers();
    render(<TokiChat />);
    
    // 채팅창 열기
    fireEvent.click(screen.getByAltText(/Chat with Toki/i));
    
    // 대사 타이핑 시간 대기
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 선택지 버튼 중 하나가 나타나는지 확인
    expect(screen.getByText(/스테이킹이 뭐야/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it("다이얼로그 노드를 변경해도 에러 없이 렌더링되어야 한다 (Hook 호출 순서 안정성 검증)", async () => {
    vi.useFakeTimers();
    render(<TokiChat />);
    
    fireEvent.click(screen.getByAltText(/Chat with Toki/i));
    
    // 타이핑 완료 후 '수익률 알려줘' 클릭
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    const choice = screen.getByText(/수익률 알려줘/i);
    fireEvent.click(choice);

    // 노드 변경 후 타이핑 시간 대기
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // 노드가 바뀌어도 Hook 에러 없이 새 텍스트가 나오는지 확인
    expect(screen.getByText(/현재 시뇨리지 APR은/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });
});
