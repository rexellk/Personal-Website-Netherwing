import Reveal from "./Reveal";
import { CONTACT } from "../data/portfolioData";

export default function Contact() {
  return (
    <>
      <section id="contact" className="pv-contact">
        <Reveal>
          <h2 className="pv-contact-title">
            {CONTACT.headingLine1} {CONTACT.headingEm}
          </h2>

          <p className="pv-contact-sub">{CONTACT.sub}</p>

          <div className="pv-contact-links">
            {CONTACT.links.map((link) => {
              const external = !link.href.startsWith("mailto");
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={link.primary ? "pv-btn-primary" : "pv-text-link"}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </Reveal>
      </section>

      <footer className="pv-footer">
        <span className="pv-footer-name">{CONTACT.footerName}</span>
        <span>{CONTACT.footerCopy.replaceAll(" · ", ". ")}</span>
      </footer>
    </>
  );
}
