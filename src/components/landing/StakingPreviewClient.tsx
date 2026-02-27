"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";
import type { StakingData } from "@/lib/staking";

interface StakingPreviewClientProps {
  data: StakingData | null;
}

export default function StakingPreviewClient({ data }: StakingPreviewClientProps) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center text-gray-500">
          {t.stakingPreview.failedToLoad}
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
          {t.stakingPreview.title}
        </h2>
        <p className="text-gray-400 text-center mb-4 text-lg">
          {t.stakingPreview.subtitle}
        </p>
        <p className="text-gray-600 text-center mb-16 text-xs">
          {t.stakingPreview.seigManagerInfo
            .replace("{totalStaked}", data.totalStaked)
            .replace("{operatorCount}", String(data.operatorCount))}
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label={t.stakingPreview.currentApr}
            value={`${data.apr.toFixed(1)}%`}
            subtext={t.stakingPreview.compoundSeigniorage}
            color="text-accent-amber"
          />
          <StatCard
            label={t.stakingPreview.totalStaked}
            value={`${(data.totalStakedRaw / 1_000_000).toFixed(1)}M`}
            subtext={`${data.totalStaked} TON`}
            color="text-accent-cyan"
          />
          <StatCard
            label={t.stakingPreview.seigPerBlock}
            value={data.seigPerBlock}
            subtext={t.stakingPreview.wtonPerBlock}
            color="text-accent-sky"
          />
          <StatCard
            label={t.stakingPreview.operators}
            value={String(data.operatorCount)}
            subtext={t.stakingPreview.autoSelected}
            color="text-accent-blue"
          />
        </div>

        {/* Earnings simulator */}
        <div className="card p-8 mt-12">
          <h3 className="text-xl font-semibold mb-6 text-center">
            {t.stakingPreview.earningsSimulator}
          </h3>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <SimulatorColumn
              amount="100 TON"
              daily={`~${dailyReward(100)}`}
              monthly={`~${monthlyReward(100)}`}
              yearly={`~${yearlyReward(100)}`}
              labels={t.stakingPreview}
            />
            <SimulatorColumn
              amount="1,000 TON"
              daily={`~${dailyReward(1000)}`}
              monthly={`~${monthlyReward(1000)}`}
              yearly={`~${yearlyReward(1000)}`}
              highlighted
              labels={t.stakingPreview}
            />
            <SimulatorColumn
              amount="10,000 TON"
              daily={`~${dailyReward(10000)}`}
              monthly={`~${monthlyReward(10000)}`}
              yearly={`~${yearlyReward(10000)}`}
              labels={t.stakingPreview}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-6">
            {t.stakingPreview.disclaimer.replace("{apr}", data.apr.toFixed(1))}
          </p>
        </div>

        {/* Operator list */}
        <div className="card p-8 mt-8">
          <h3 className="text-xl font-semibold mb-6 text-center">
            {t.stakingPreview.activeOperators}
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
                  <span className="text-gray-500 text-xs">TON</span>
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
  labels,
}: {
  amount: string;
  daily: string;
  monthly: string;
  yearly: string;
  highlighted?: boolean;
  labels: { daily: string; monthly: string; yearly: string };
}) {
  return (
    <div
      className={`p-6 rounded-xl ${
        highlighted
          ? "bg-accent-blue/10 border border-accent-blue/30"
          : "bg-white/5"
      }`}
    >
      <div
        className={`text-lg font-bold mb-4 ${highlighted ? "text-accent-sky" : "text-gray-300"}`}
      >
        {amount}
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-gray-500">{labels.daily}</span>
          <div className="font-mono-num text-accent-amber">{daily} TON</div>
        </div>
        <div>
          <span className="text-gray-500">{labels.monthly}</span>
          <div className="font-mono-num text-accent-cyan">{monthly} TON</div>
        </div>
        <div>
          <span className="text-gray-500">{labels.yearly}</span>
          <div className="font-mono-num text-accent-blue font-semibold">
            {yearly} TON
          </div>
        </div>
      </div>
    </div>
  );
}
