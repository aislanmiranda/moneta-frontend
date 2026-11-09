import { useParams } from "react-router-dom";
import { useModules } from "../../api/useModules";
import { DateControlPage } from "./DateControlPage";
import { DateTimeControlPage } from "./DateTimeControlPage";
import { TimeControlPage } from "./TimeControlPage";

export function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const { modules, loading, error } = useModules();

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const module = modules.find((m) => m.slug === slug);

  if (!module) {
    return <p>Módulo não encontrado.</p>;
  }

  switch (module.pattern) {
    case "DateControl":
      return <DateControlPage module={module} />;
    case "TimeControl":
      return <TimeControlPage module={module} />;
    case "DateTimeControl":
      return <DateTimeControlPage module={module} />;
    default:
      return <p>Padrão de módulo desconhecido.</p>;
  }
}
