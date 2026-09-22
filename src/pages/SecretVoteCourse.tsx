import SecretVoteCourseView from "@/components/secret-vote-course/SecretVoteCourse";
import PageHeader from "@/components/PageHeader";
import { useSeo } from "@/hooks/use-seo";

export default function SecretVoteCoursePage() {
  useSeo({
    title: "The Grid Primer Course | Austin Clean Energy",
    description:
      "An interactive course and glossary on how the Texas grid, electricity prices, and Austin's energy decisions actually work.",
  });

  return (
    <>
      <PageHeader
        title="The Grid Primer"
        subtitle="A short course on the Texas grid, electricity prices, and Austin's energy decisions."
      />
      <SecretVoteCourseView />
    </>
  );
}
