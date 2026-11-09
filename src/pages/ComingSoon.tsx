import "./ComingSoon.css";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="coming-soon">
      <h1>{title}</h1>
      <p>Essa tela ainda está sendo desenhada.</p>
    </div>
  );
}
