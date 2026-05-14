'use client';
import { STACK_COMPONENTS } from '@/data/components';
import LogoImg from '@/components/shared/LogoImg';
import Link from 'next/link';

export default function IntegrationCloud() {
  const all = STACK_COMPONENTS.slice(0, 32);
  return (
    <section className="section">
      <div className="container">
        <div className="fband-head">
          <div>
            <div className="overline" style={{ marginBottom: 14 }}>Stack components</div>
            <h2>Best-of-breed, <span className="accent">preconfigured.</span></h2>
          </div>
          <div className="desc">
            From LLMs to vector stores, from orchestration to BI — every tool below works on Shakudo
            with one click and is maintained at production grade by our team.
          </div>
        </div>
        <div className="cloud-wrap">
          <div className="cloud-grid">
            {all.map(c => (
              <div key={c.name} className="cloud-chip" title={c.oneLiner}>
                <span className="logo"><LogoImg src={c.logo} name={c.name} /></span>
                <span className="name">{c.name}</span>
              </div>
            ))}
            <Link href="/stack-builder" className="cloud-chip cloud-more">
              <span style={{ fontFamily: 'var(--font-mono)' }}>+ {235 - all.length} more</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
