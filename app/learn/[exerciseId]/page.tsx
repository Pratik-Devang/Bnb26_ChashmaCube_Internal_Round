import { ExerciseWorkspace } from "@/components/views/ExerciseWorkspace";

interface PageProps {
  params: Promise<{ exerciseId: string }>;
}

export default async function ExercisePage({ params }: PageProps) {
  const { exerciseId } = await params;
  return <ExerciseWorkspace exerciseId={exerciseId} />;
}
