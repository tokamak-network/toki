"use client";

import { createContext, useContext, type ReactNode } from "react";

interface StakingDataContextType {
  apr: number | null;
}

const StakingDataContext = createContext<StakingDataContextType>({ apr: null });

export function StakingDataProvider({
  apr,
  children,
}: {
  apr: number | null;
  children: ReactNode;
}) {
  return (
    <StakingDataContext.Provider value={{ apr }}>
      {children}
    </StakingDataContext.Provider>
  );
}

export function useStakingData() {
  return useContext(StakingDataContext);
}

/** Replace `{apr}` placeholders in a string with a formatted APR value. */
export function replaceApr(text: string, apr: number | null): string {
  const display = apr ? apr.toFixed(0) : "20+";
  return text.replace(/\{apr\}/g, display);
}

/** Hook: get apr-replaced text. */
export function useAprText(text: string): string {
  const { apr } = useStakingData();
  return replaceApr(text, apr);
}
