import Hero from '../sections/Hero';
import Problem from '../sections/Problem';
import Solution from '../sections/Solution';
import ComponentsShowcase from '../sections/ComponentsShowcase';
import HowItWorks from '../sections/HowItWorks';
import CTA from '../sections/CTA';

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <ComponentsShowcase />
      <HowItWorks />
      <CTA />
    </>
  );
}
