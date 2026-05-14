const customers = ['Quantum Metric', 'Risk Thinking', 'EnPowered', 'Ritual', 'PredictNow', 'Geyser Data'];

export default function LogoStrip() {
  return (
    <section className="logos">
      <div className="logos-inner">
        <div className="logos-label">Trusted by AI &amp; data teams</div>
        {customers.map(c => <div key={c} className="logos-mark">{c}</div>)}
      </div>
    </section>
  );
}
