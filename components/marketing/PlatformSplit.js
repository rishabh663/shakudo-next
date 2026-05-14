export default function PlatformSplit() {
  return (
    <section className="section" style={{ background: 'rgba(20,17,14,0.4)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="container">
        <div className="split">
          <div>
            <div className="overline">The OS for AI</div>
            <h2>From notebook to production — without rebuilding the platform.</h2>
            <p>Shakudo gives you a single workspace where data engineers, ML engineers, and analysts ship together.</p>
            <ul>
              <li>One-click provisioning for compute, storage, and serving</li>
              <li>SSO, RBAC, secrets, and audit logging out of the box</li>
              <li>GraphQL API for programmatic stack management</li>
              <li>Forward-deployed engineers for go-live and hardening</li>
            </ul>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href="#" className="btn btn-primary">Read the docs <span className="arrow">→</span></a>
              <a href="#" className="btn btn-secondary">See architecture</a>
            </div>
          </div>
          <div className="product-card">
            <div className="product-chrome">
              <span className="dot" style={{ background: '#e15d4c' }}></span>
              <span className="dot" style={{ background: '#d4a64a' }}></span>
              <span className="dot" style={{ background: '#6fb56b' }}></span>
              <span className="lbl">acme-prod · shakudo cli</span>
            </div>
            <div className="product-body">
              <div className="term">
                <div><span className="prompt">$</span> <span className="dim">shakudo stack create</span> <span className="name">--from rag-starter</span></div>
                <div className="dim">→ resolving 6 components</div>
                <div>{'  '}· dify@2.4.4 <span className="dim">llm</span></div>
                <div>{'  '}· postgres@16 <span className="dim">database</span></div>
                <div>{'  '}· pgvector@0.7 <span className="dim">vector</span></div>
                <div>{'  '}· airbyte@1.5.1 <span className="dim">ingestion</span></div>
                <div>{'  '}· prefect@2 <span className="dim">orchestration</span></div>
                <div>{'  '}· grafana@10 <span className="dim">observability</span></div>
                <div className="dim">→ wiring secrets via cluster KMS</div>
                <div className="ok">✓ stack ready · 6 services · 2m 47s</div>
                <div style={{ marginTop: 8 }}>
                  <span className="prompt">$</span>{' '}
                  <span style={{ display: 'inline-block', width: 7, height: 13, background: 'var(--color-copper-400)', verticalAlign: -2, animation: 'blink 1s steps(1) infinite' }}></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
