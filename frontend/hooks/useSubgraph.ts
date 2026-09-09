/**
 * React Query hooks for querying The Graph subgraph.
 * Queries: recent transactions, daily stats, policy events.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { GRAPH_ENDPOINTS } from '../lib/chain/config';

// ─── Types matching schema.graphql ────────────────────────────────────────

export interface GqlTransaction {
  id: string;
  recipient: string;
  amount: string;
  nonce: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GqlPolicyEvent {
  id: string;
  type: 'APPROVED' | 'BLOCKED';
  account: string;
  recipient: string;
  amount: string;
  reason: string | null;
  blockTimestamp: string;
  transactionHash: string;
}

export interface GqlDailyStats {
  id: string;
  date: string;
  txCount: string;
  blockedCount: string;
  totalVolume: string;
}

export interface GqlPolicy {
  singleTxLimit: string;
  dailyLimit: string;
  updatedAt: string;
}

// ─── GraphQL client ───────────────────────────────────────────────────────

async function gqlFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const endpoint = GRAPH_ENDPOINTS.studio;
  if (!endpoint) throw new Error('NEXT_PUBLIC_GRAPH_STUDIO_URL not set');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Graph query failed: ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Queries ─────────────────────────────────────────────────────────────

const RECENT_TRANSACTIONS_QUERY = `
  query RecentTransactions($account: String!, $first: Int = 20) {
    transactions(
      where: { account: $account }
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
    ) {
      id
      recipient
      amount
      nonce
      blockTimestamp
      transactionHash
    }
  }
`;

const POLICY_EVENTS_QUERY = `
  query PolicyEvents($first: Int = 50) {
    policyEvents(
      orderBy: blockTimestamp
      orderDirection: desc
      first: $first
    ) {
      id
      type
      account
      recipient
      amount
      reason
      blockTimestamp
      transactionHash
    }
  }
`;

const DAILY_STATS_QUERY = `
  query DailyStats($last: Int = 7) {
    dailyStats(
      orderBy: id
      orderDirection: desc
      first: $last
    ) {
      id
      date
      txCount
      blockedCount
      totalVolume
    }
  }
`;

const CURRENT_POLICY_QUERY = `
  query CurrentPolicy {
    policy(id: "global") {
      singleTxLimit
      dailyLimit
      updatedAt
    }
  }
`;

// ─── React Query hooks ────────────────────────────────────────────────────

/** Fetch recent transactions for a given account address */
export function useRecentTransactions(accountAddress: string | undefined) {
  return useQuery({
    queryKey: ['transactions', accountAddress],
    queryFn: () =>
      gqlFetch<{ transactions: GqlTransaction[] }>(RECENT_TRANSACTIONS_QUERY, {
        account: accountAddress?.toLowerCase(),
      }),
    enabled: !!accountAddress && !!GRAPH_ENDPOINTS.studio,
    staleTime: 30_000,
  });
}

/** Fetch recent policy approval/block events */
export function usePolicyEvents(limit = 50) {
  return useQuery({
    queryKey: ['policyEvents', limit],
    queryFn: () => gqlFetch<{ policyEvents: GqlPolicyEvent[] }>(POLICY_EVENTS_QUERY, { first: limit }),
    enabled: !!GRAPH_ENDPOINTS.studio,
    staleTime: 30_000,
  });
}

/** Fetch daily stats for the last N days */
export function useDailyStats(days = 7) {
  return useQuery({
    queryKey: ['dailyStats', days],
    queryFn: () => gqlFetch<{ dailyStats: GqlDailyStats[] }>(DAILY_STATS_QUERY, { last: days }),
    enabled: !!GRAPH_ENDPOINTS.studio,
    staleTime: 60_000,
  });
}

/** Fetch the current on-chain policy limits (from The Graph) */
export function useGraphPolicy() {
  return useQuery({
    queryKey: ['graphPolicy'],
    queryFn: () => gqlFetch<{ policy: GqlPolicy | null }>(CURRENT_POLICY_QUERY),
    enabled: !!GRAPH_ENDPOINTS.studio,
    staleTime: 60_000,
  });
}
