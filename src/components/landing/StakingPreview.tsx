import { fetchStakingData } from "@/lib/staking";

export default async function StakingPreview() {
  let data;
  try {
    data = await fetchStakingData();
  } catch {
    // Fallback if RPC fails
    data = null;
  }

  if (!data) {
    return (
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center text-gray-500">
          Failed to load on-chain data. Please refresh.
        </div>
      </section>
    );
  }

  const dailyReward = (amount: number) =>
    ((amount * data.apr) / 100 / 365).toFixed(2);
  const monthlyReward = (amount: number) =>
    ((amount * data.apr) / 100 / 12).toFixed(1);
  const yearlyReward = (amount: number) =>
    ((amount * data.apr) / 100).toFixed(0);

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Live Staking Stats
        </h2>
        <p className="text-gray-400 text-center mb-4 text-lg">
          Real-time data from Tokamak Network contracts
        </p>
        <p className="text-gray-600 text-center mb-16 text-xs">
          SeigManager: {data.totalStaked} WTON staked across {data.operatorCount} operators
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Current APR"
            value={`${data.apr.toFixed(1)}%`}
            subtext="Compound seigniorage"
            color="text-accent-gold"
          />
          <StatCard
            label="Total Staked"
            value={`${(data.totalStakedRaw / 1_000_000).toFixed(1)}M`}
            subtext={`${data.totalStaked} WTON`}
            color="text-accent-cyan"
          />
          <StatCard
            label="Seig / Block"
            value={data.seigPerBlock}
            subtext="WTON per block (~12s)"
            color="text-accent-purple"
          />
          <StatCard
            label="Operators"
            value={String(data.operatorCount)}
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
              daily={`~${dailyReward(100)}`}
              monthly={`~${monthlyReward(100)}`}
              yearly={`~${yearlyReward(100)}`}
            />
            <SimulatorColumn
              amount="1,000 TON"
              daily={`~${dailyReward(1000)}`}
              monthly={`~${monthlyReward(1000)}`}
              yearly={`~${yearlyReward(1000)}`}
              highlighted
            />
            <SimulatorColumn
              amount="10,000 TON"
              daily={`~${dailyReward(10000)}`}
              monthly={`~${monthlyReward(10000)}`}
              yearly={`~${yearlyReward(10000)}`}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-6">
            * Based on current on-chain APR ({data.apr.toFixed(1)}%). Actual returns may vary. Seigniorage compounds automatically.
          </p>
        </div>

        {/* Operator list */}
        <div className="card p-8 mt-8">
          <h3 className="text-xl font-semibold mb-6 text-center">
            Active Operators
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {data.operators.map((op) => (
              <div
                key={op.address}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm"
              >
                <span className="text-gray-300 truncate">{op.name || op.address.slice(0, 10)}</span>
                <span className="text-accent-cyan font-mono-num ml-2 shrink-0">
                  {Number(op.totalStaked).toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}{" "}
                  <span className="text-gray-500 text-xs">WTON</span>
                </span>
              </div>
            ))}
          </div>
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
      <div
        className={`text-lg font-bold mb-4 ${highlighted ? "text-accent-purple" : "text-gray-300"}`}
      >
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
          <div className="font-mono-num text-accent-pink font-semibold">
            {yearly} TON
          </div>
        </div>
      </div>
    </div>
  );
}
