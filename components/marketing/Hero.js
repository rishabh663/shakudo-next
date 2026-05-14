import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid"></div>
      <div className="hero-bg"></div>
      <div className="hero-inner">
        <div>
          <div className="overline">The operating system for AI</div>
          <h1>
            Pick your stack.<br />
            <span className="accent">We build the rest.</span>
          </h1>
          <p className="lead">
            Shakudo runs inside your VPC and orchestrates 235+ best-of-breed open-source and commercial
            data and AI tools — with one dashboard, one identity, and zero DevOps overhead.
          </p>
          <div className="hero-ctas">
            <Link href="/stack-builder" className="btn btn-primary btn-lg">
              Build your stack <span className="arrow">→</span>
            </Link>
            <a href="#" className="btn btn-secondary btn-lg">Book a demo</a>
          </div>
          <div className="hero-meta">
            <span>235+ integrations</span>
            <span className="dot">·</span>
            <span>Runs in your VPC</span>
            <span className="dot">·</span>
            <span>SOC 2 · HIPAA</span>
          </div>
        </div>
        <div></div>
      </div>
    </section>
  );
}
