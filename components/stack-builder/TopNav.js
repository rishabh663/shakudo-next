import Image from 'next/image';
import Link from 'next/link';

export default function TopNav() {
  return (
    <header className="topnav">
      <Link href="/" className="logo">
        <Image src="/assets/logo-wordmark-white.svg" alt="Shakudo" width={110} height={22} />
      </Link>
      <div className="grow"></div>
      <span className="product-label">Stack Builder</span>
    </header>
  );
}
