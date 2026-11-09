import {
  PROTOCOL_VERSION,
  evidenceSources,
  protocolRules,
} from "../lib/protocol";
export function ProtocolPanel() {
  return (
    <section className="card">
      <span className="eyebrow blue">FUNDAMENTO Y LÍMITES</span>
      <h2>Por qué la app propone esto</h2>
      <p>
        Protocolo {PROTOCOL_VERSION}. Fuentes consultadas el 9 de noviembre de
        2026. Evidencia general y decisiones de la plantilla están
        diferenciadas. La app no tiene validación clínica individual.
      </p>
      <details>
        <summary>Ver reglas, fuentes y poblaciones</summary>
        {protocolRules.map((r) => (
          <article className="exercise" id={`rule-${r.id}`} key={r.id}>
            <h3>
              {r.id} · {r.title}
            </h3>
            <small>{r.kind}</small>
            <p>{r.text}</p>
            {r.sources.map((id) => {
              const source = evidenceSources[id];
              return (
                <p key={id}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                  <small className="evidence-detail">
                    {source.type} · {source.population}
                  </small>
                </p>
              );
            })}
          </article>
        ))}
      </details>
    </section>
  );
}
