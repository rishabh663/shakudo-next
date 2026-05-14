import Link from 'next/link';
import Image from 'next/image';

export default function MarketingNav() {
  return (
    <header className="mnav">
      <nav className="mnav-inner">
        <Link href="/" className="mnav-logo">
          <Image src="/assets/logo-wordmark-white.svg" alt="Shakudo" width={135} height={34} />
        </Link>
        <div className="mnav-links">
          <a href="#" className="mnav-link">Platform <span className="caret">▾</span></a>
          <Link href="/stack-builder" className="mnav-link">Stack Builder</Link>
          <a href="#" className="mnav-link">Use cases <span className="caret">▾</span></a>
          <a href="#" className="mnav-link">Customers</a>
          <a href="#" className="mnav-link">Resources <span className="caret">▾</span></a>
          <a href="#" className="mnav-link">Pricing</a>
        </div>
        <div className="mnav-grow"></div>
        <a href="#" className="mnav-link">Sign in</a>
        <a href="#" className="btn btn-secondary" style={{ height: 36, fontSize: 13 }}>Talk to an expert</a>
        <Link href="/stack-builder" className="btn btn-primary" style={{ height: 36, fontSize: 13 }}>
          Get started <span className="arrow">→</span>
        </Link>
      </nav>
    </header>
  );
}
