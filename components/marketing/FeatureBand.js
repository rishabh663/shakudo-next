export default function FeatureBand() {
  return (
    <section className="section">
      <div className="container">
        <div className="fband-head">
          <div>
            <div className="overline" style={{ marginBottom: 14 }}>The platform</div>
            <h2>One operating layer for <span className="accent">every tool you need.</span></h2>
          </div>
          <div className="desc">
            Shakudo manages networking, credentials, SSO, secrets, and interconnectivity between every
            component you select — so your team focuses on the workload, not the cluster.
          </div>
        </div>
        <div className="feature-grid">
          <article className="feature-card">
            <div className="icon">⌗</div>
            <h3>235+ stack components, one-click deploy.</h3>
            <p>Curated, production-ready open-source tools — preconfigured for security, SSO, observability, and scale.</p>
            <div className="figure">airbyte · dify · spark · ray · triton · superset · mlflow · …</div>
          </article>
          <article className="feature-card">
            <div className="icon">⏻</div>
            <h3>Runs inside your VPC.</h3>
            <p>Your data, models, and IP never leave your cloud. Deploy on AWS, GCP, Azure, or on-prem Kubernetes.</p>
            <div className="figure">kubernetes-native · BYO cloud · air-gapped option</div>
          </article>
          <article className="feature-card">
            <div className="icon">⌥</div>
            <h3>No vendor lock-in, ever.</h3>
            <p>Swap any component for another in minutes. Upgrade tools as the AI landscape evolves.</p>
            <div className="figure">open-source first · standard APIs · portable workloads</div>
          </article>
        </div>
      </div>
    </section>
  );
}
