import { HomeDashboard } from "@/components/HomeDashboard";
import { getSiteLatestMapWithScores } from "@/lib/storage/siteLatest";
import { getSiteReviewMap } from "@/lib/storage/siteReview";

export default async function Home() {
  const [siteLatest, siteReview] = await Promise.all([
    getSiteLatestMapWithScores(),
    getSiteReviewMap(),
  ]);
  return <HomeDashboard siteLatest={siteLatest} siteReview={siteReview} />;
}
