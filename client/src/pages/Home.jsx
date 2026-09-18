import Hero from '../sections/Hero';
import Problem from '../sections/Problem';
import Solution from '../sections/Solution';
import ComponentsShowcase from '../sections/ComponentsShowcase';
import InContext from '../sections/InContext';
import HowItWorks from '../sections/HowItWorks';
import CTA from '../sections/CTA';
import useTitle from '../lib/useTitle';
import useScrollReveal from '../lib/useScrollReveal';

export default function Home() {
  useTitle();
  useScrollReveal();
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <ComponentsShowcase />
      <InContext />
      <HowItWorks />
      <CTA />
    </>
  );
}
