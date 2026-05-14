import Link from 'next/link';

export default function CTABand() {
  return (
    <section className="cta-band" id="stack">
      <div className="cta-band-inner">
        <h2>Your stack. Your cloud. Your data.</h2>
        <p>Pick the components, submit your requirements, and have a Shakudo expert deploy your platform inside your VPC.</p>
        <div className="cta-band-actions">
          <Link href="/stack-builder" className="btn btn-lg btn-on-copper">
            Open Stack Builder <span className="arrow">→</span>
          </Link>
          <a href="#" className="btn btn-lg btn-ghost-on-copper">Talk to an expert</a>
        </div>
      </div>
    </section>
  );
}
