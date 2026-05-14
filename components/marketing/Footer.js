import Image from 'next/image';

const cols = [
  { title: 'Platform', links: ['Shakudo Platform', 'Kaji', 'AI Gateway', 'Stack Components', 'MCP Proxy', 'AI Agents'] },
  { title: 'Use cases', links: ['Knowledge Graph', 'Vector + LLM', 'Workflow Automation', 'Text-to-SQL', 'Reverse ETL'] },
  { title: 'Resources', links: ['Docs', 'Integration catalog', 'Customer stories', 'Blog', 'Bitnami alternative'] },
  { title: 'Company', links: ['About', 'Partners', 'Careers', 'Contact', 'Press'] },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Image src="/assets/logo-wordmark-white.svg" alt="Shakudo" width={120} height={30} />
            <p className="tag">The operating system for AI and data. Run best-of-breed tools inside your VPC.</p>
          </div>
          {cols.map(c => (
            <div key={c.title} className="footer-col">
              <h4>{c.title}</h4>
              {c.links.map(l => <a key={l} href="#">{l}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-base">
          <span className="copyright">© 2026 Shakudo Inc. · Toronto, Ontario</span>
          <span className="grow"></span>
          <span className="copyright">SOC 2 · HIPAA · ISO 27001</span>
          <div className="socials">
            <a href="#" className="social" aria-label="GitHub">⌥</a>
            <a href="#" className="social" aria-label="LinkedIn">in</a>
            <a href="#" className="social" aria-label="X">𝕏</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
