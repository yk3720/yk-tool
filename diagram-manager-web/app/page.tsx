import { DiagramWorkspace } from "@/components/diagram-manager/DiagramWorkspace";
import { figureRepository, getFigureStorageKind } from "@/lib/diagram/repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  const initialFigures = await figureRepository.list();
  const storage = getFigureStorageKind();

  return <DiagramWorkspace initialFigures={initialFigures} storage={storage} />;
}
