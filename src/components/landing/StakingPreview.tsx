"use client";

import { SEIG_PER_BLOCK, BLOCKS_PER_YEAR } from "@/constants/contracts";

const TOTAL_STAKED = 29_651_365; // approximate from on-chain
const ANNUAL_SEIG = SEIG_PER_BLOCK * BLOCKS_PER_YEAR;
const APR = ((ANNUAL_SEIG / TOTAL_STAKED) * 100).toFixed(1);

export default function StakingPreview() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Live Staking Stats
        </h2>
        <p className="text-gray-400 text-center mb-16 text-lg">
          Real-time data from Tokamak Network
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Current APR"
            value={`${APR}%`}
            subtext="Compound seigniorage"
            color="text-accent-gold"
          />
          <StatCard
            label="Total Staked"
            value={`${(TOTAL_STAKED / 1_000_000).toFixed(1)}M`}
            subtext="WTON across 10 operators"
            color="text-accent-cyan"
          />
          <StatCard
            label="Seig / Block"
            value={`${SEIG_PER_BLOCK}`}
            subtext="WTON per block (~12s)"
            color="text-accent-purple"
          />
          <StatCard
            label="Operators"
            value="10"
            subtext="Auto-selected for you"
            color="text-accent-pink"
          />
        </div>

        {/* Earnings simulator */}
        <div className="card p-8 mt-12">
          <h3 className="text-xl font-semibold mb-6 text-center">
            Earnings Simulator
          </h3>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <SimulatorColumn
              amount="100 TON"
              daily="~0.10"
              monthly="~2.9"
              yearly="~34.7"
            />
            <SimulatorColumn
              amount="1,000 TON"
              daily="~0.95"
              monthly="~28.9"
              yearly="~347"
              highlighted
            />
            <SimulatorColumn
              amount="10,000 TON"
              daily="~9.51"
              monthly="~289"
              yearly="~3,470"
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-6">
            * Estimates based on current APR. Actual returns may vary. Seigniorage compounds automatically.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="card p-6 text-center">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className={`text-3xl font-bold font-mono-num ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-2">{subtext}</div>
    </div>
  );
}

function SimulatorColumn({
  amount,
  daily,
  monthly,
  yearly,
  highlighted = false,
}: {
  amount: string;
  daily: string;
  monthly: string;
  yearly: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-xl ${
        highlighted
          ? "bg-accent-purple/10 border border-accent-purple/30"
          : "bg-white/5"
      }`}
    >
      <div className={`text-lg font-bold mb-4 ${highlighted ? "text-accent-purple" : "text-gray-300"}`}>
        {amount}
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-500">Daily</span>
          <div className="font-mono-num text-accent-gold">{daily} TON</div>
        </div>
        <div>
          <span className="text-gray-500">Monthly</span>
          <div className="font-mono-num text-accent-cyan">{monthly} TON</div>
        </div>
        <div>
          <span className="text-gray-500">Yearly</span>
          <div className="font-mono-num text-accent-pink font-semibold">{yearly} TON</div>
        </div>
      </div>
    </div>
  );
}
