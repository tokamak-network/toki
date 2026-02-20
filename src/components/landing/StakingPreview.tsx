import { fetchStakingData } from "@/lib/staking";
import StakingPreviewClient from "./StakingPreviewClient";

export default async function StakingPreview() {
  let data;
  try {
    data = await fetchStakingData();
  } catch {
    data = null;
  }

  return <StakingPreviewClient data={data} />;
}
