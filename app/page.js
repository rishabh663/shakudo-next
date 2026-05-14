import '../styles/marketing.css';
import MarketingNav from '@/components/marketing/MarketingNav';
import Hero from '@/components/marketing/Hero';
import LogoStrip from '@/components/marketing/LogoStrip';
import FeatureBand from '@/components/marketing/FeatureBand';
import PlatformSplit from '@/components/marketing/PlatformSplit';
import IntegrationCloud from '@/components/marketing/IntegrationCloud';
import CTABand from '@/components/marketing/CTABand';
import Footer from '@/components/marketing/Footer';

export default function Home() {
  return (
    <>
      <MarketingNav />
      <Hero />
      <LogoStrip />
      <FeatureBand />
      <PlatformSplit />
      <IntegrationCloud />
      <CTABand />
      <Footer />
    </>
  );
}
