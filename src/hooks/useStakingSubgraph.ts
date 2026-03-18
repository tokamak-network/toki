"use client";

import { useState, useEffect, useCallback } from "react";

// Tokamak staking-v1-subgraph (The Graph decentralized network)
// Subgraph ID: CJLiXNdHXJ22BzWignD62gohDRVTYXJQVgU4qKJEtNVS
// Playground: https://thegraph.com/explorer/subgraphs/CJLiXNdHXJ22BzWignD62gohDRVTYXJQVgU4qKJEtNVS

const SUBGRAPH_ID = "CJLiXNdHXJ22BzWignD62gohDRVTYXJQVgU4qKJEtNVS";

function getSubgraphUrl(): string | null {
  const apiKey = process.env.NEXT_PUBLIC_GRAPH_API_KEY;
  if (!apiKey) return null;
  return `https://gateway-arbitrum.network.thegraph.com/api/${apiKey}/subgraphs/id/${SUBGRAPH_ID}`;
}

// All amounts from subgraph are in 27-decimal (RAY) format
const RAY = 1e27;

export interface StakingHistory {
  amount: string;
  timestamp: string;
  candidateName: string;
}

export interface StakingEvent {
  type: "stake" | "unstake" | "withdrawal" | "restake";
  amount: string;
  timestamp: string;
  candidateName: string;
  transactionHash?: string;
}

export interface UserStakingData {
  /** Total deposited amount (original principal, 27-decimal raw) */
  totalDeposited: bigint;
  /** Total earned seigniorage (27-decimal raw) */
  totalEarnedSeig: bigint;
  /** Formatted deposited amount */
  depositedFormatted: string;
  /** Formatted seigniorage earnings */
  seigEarnedFormatted: string;
  /** Staking history events */
  stakingHistory: StakingHistory[];
  /** Combined staking/unstaking/withdrawal event timeline */
  events: StakingEvent[];
}

function formatRay(raw: string): string {
  const num = Number(raw) / RAY;
  if (num === 0) return "0";
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

async function fetchUserStaking(
  url: string,
  address: string,
): Promise<UserStakingData | null> {
  const query = `
    query GetUserData($id: String!) {
      users(where: { id: $id }) {
        id
        totalStaked
        totalEarnedSeig
        staked(first: 20, orderBy: timestamp, orderDirection: desc) {
          amount
          timestamp
          candidate { name }
          transaction { id }
        }
        unstaked(first: 20, orderBy: timestamp, orderDirection: desc) {
          amount
          timestamp
          candidate { name }
          transaction { id }
        }
        withdrawal(first: 20, orderBy: timestamp, orderDirection: desc) {
          amount
          timestamp
          candidate { name }
          transaction { id }
        }
      }
    }
  `;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { id: address.toLowerCase() },
    }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  if (json.errors || !json.data?.users?.length) return null;

  const user = json.data.users[0];
  const totalDeposited = BigInt(user.totalStaked || "0");
  const totalEarnedSeig = BigInt(user.totalEarnedSeig || "0");

  // Build combined event timeline
  interface RawEvent {
    amount: string;
    timestamp: string;
    candidate: { name: string };
    transaction?: { id: string };
  }
  const events: StakingEvent[] = [];

  for (const s of (user.staked || []) as RawEvent[]) {
    events.push({
      type: "stake",
      amount: formatRay(s.amount),
      timestamp: s.timestamp,
      candidateName: s.candidate?.name || "Unknown",
      transactionHash: s.transaction?.id,
    });
  }
  for (const s of (user.unstaked || []) as RawEvent[]) {
    events.push({
      type: "unstake",
      amount: formatRay(s.amount),
      timestamp: s.timestamp,
      candidateName: s.candidate?.name || "Unknown",
      transactionHash: s.transaction?.id,
    });
  }
  for (const s of (user.withdrawal || []) as RawEvent[]) {
    events.push({
      type: "withdrawal",
      amount: formatRay(s.amount),
      timestamp: s.timestamp,
      candidateName: s.candidate?.name || "Unknown",
      transactionHash: s.transaction?.id,
    });
  }

  // Sort by timestamp descending
  events.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return {
    totalDeposited,
    totalEarnedSeig,
    depositedFormatted: formatRay(user.totalStaked || "0"),
    seigEarnedFormatted: formatRay(user.totalEarnedSeig || "0"),
    stakingHistory: (user.staked || []).map(
      (s: { amount: string; timestamp: string; candidate: { name: string } }) => ({
        amount: formatRay(s.amount),
        timestamp: s.timestamp,
        candidateName: s.candidate?.name || "Unknown",
      }),
    ),
    events,
  };
}

export function useStakingSubgraph(address: string | undefined) {
  const [data, setData] = useState<UserStakingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  const refresh = useCallback(async () => {
    const url = getSubgraphUrl();
    if (!url || !address) {
      setAvailable(false);
      setData(null);
      return;
    }
    setAvailable(true);
    setLoading(true);
    try {
      const result = await fetchUserStaking(url, address);
      setData(result);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, available, refresh };
}
