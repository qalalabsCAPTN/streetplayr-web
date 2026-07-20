import ContactHero from "@/components/sections/contact/Hero";
import ContactInfo from "@/components/sections/contact/ContactInfo";
import ContactForm from "@/components/sections/contact/ContactForm";

export default function ContactPage() {
  return (
    <div className="flex flex-col w-full bg-transparent">
      <ContactHero />
      
      <section className="w-full max-w-[min(98vw,2560px)] mx-auto px-4 md:px-8 lg:px-12 pb-28 md:pb-36 lg:pb-48">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(420px,1.5fr)] gap-16 lg:gap-24 items-start">
          <ContactInfo />
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
