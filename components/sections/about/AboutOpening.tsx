import Image from "next/image";

export default function AboutHero() {
  return (
    <section className="about-hero bg-[#050505] min-h-[60vh]">
      <div className="about-content">
        <h1 className="about-headline">Core Brand Directive</h1>
        <p className="about-description">
          We did not launch a brand. We declared a position. Born from the
          tension between the street and the studio — between restraint and
          controlled chaos. StreetPlayR does not follow culture. It moves before it.
        </p>
      </div>
      <div className="about-media">
        <Image
          src="/assets/hero-tees.png"
          alt="StreetPlayR brand editorial"
          fill
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}
