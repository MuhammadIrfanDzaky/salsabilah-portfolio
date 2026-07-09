import { profile, ui } from "@/data/profile";
import type { Locale } from "@/lib/i18n";
import { SectionHeading } from "@/components/section-heading";

const FORMSPREE_ACTION = "https://formspree.io/f/REPLACE_ME";

export function Contact({ locale }: { locale: Locale }) {
  const form = ui.contact.form;
  const inputClasses =
    "w-full box-border rounded-[10px] border border-line-on-green bg-on-green/10 px-3.5 py-3 text-[15px] text-on-green-strong transition-colors focus:border-sand focus:outline-none";

  return (
    <section id="contact" className="bg-green text-on-green">
      <div className="mx-auto max-w-[1160px] px-6 py-[clamp(32px,4vw,48px)]">
        <div className="mb-[clamp(30px,4vw,44px)]">
          <SectionHeading
            kicker={ui.contact.kicker}
            title={ui.contact.title}
            lead={ui.contact.lead}
            locale={locale}
            onGreen
          />
        </div>
        <div className="grid items-start gap-[clamp(32px,5vw,64px)] md:grid-cols-2">
          <dl className="m-0 flex flex-col">

            <div className="flex items-baseline gap-4 border-b border-line-on-green pb-3">
              <dt className="w-[118px] flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-sand">
                {ui.contact.institutionLabel[locale]}
              </dt>
              <dd className="m-0 min-w-0 text-[15.5px] text-on-green">
                {profile.institution[locale]}
              </dd>
            </div>

            <div className="flex items-baseline gap-4 border-b border-line-on-green py-3">
              <dt className="w-[118px] flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-sand">
                {ui.contact.emailLabel[locale]}
              </dt>
              <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">
                <a
                  href={`mailto:${profile.email}`}
                  className="text-[15.5px] text-on-green underline decoration-sand/60 hover:text-on-green-strong"
                >
                  {profile.email}
                </a>
              </dd>
            </div>

            <div className="flex items-baseline gap-4 border-b border-line-on-green py-3">
              <dt className="w-[118px] flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-sand">
                {ui.contact.linkedinLabel[locale]}
              </dt>
              <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15.5px] text-on-green underline decoration-sand/60 hover:text-on-green-strong"
                >
                  {profile.linkedin.replace("https://www.", "")}
                </a>
              </dd>
            </div>

            <div className="flex items-baseline gap-4 border-b border-line-on-green py-3">
              <dt className="w-[118px] flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-sand">
                {ui.contact.orcidLabel[locale]}
              </dt>
              <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">
                <a
                  href={profile.orcid}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15.5px] text-on-green underline decoration-sand/60 hover:text-on-green-strong"
                >
                  {profile.orcid.replace("https://www.", "")}
                </a>
              </dd>
            </div>

            <div className="flex items-baseline gap-4 border-b border-line-on-green py-3">
              <dt className="w-[118px] flex-none font-mono text-[11px] uppercase tracking-[0.12em] text-sand">
                {ui.contact.scholarLabel[locale]}
              </dt>
              <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">
                <a
                  href={profile.scholar}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15.5px] text-on-green underline decoration-sand/60 hover:text-on-green-strong"
                >
                  {profile.scholar.replace("https://www.", "")}
                </a>
              </dd>
            </div>

          </dl>

          <form
            action={FORMSPREE_ACTION}
            method="POST"
            className="flex flex-col gap-4 rounded-[18px] border border-line-on-green bg-on-green/5 p-[clamp(24px,3vw,32px)]"
          >
            <h3 className="m-0 font-serif text-[21px] font-semibold text-on-green-strong">
              {form.title[locale]}
            </h3>
            <div>
              <label
                htmlFor="contact-name"
                className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em]"
              >
                {form.name[locale]}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={form.namePlaceholder[locale]}
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em]"
              >
                {form.email[locale]}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={form.emailPlaceholder[locale]}
                className={inputClasses}
              />
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="mb-1.5 block text-[13px] font-semibold tracking-[0.02em]"
              >
                {form.message[locale]}
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                placeholder={form.messagePlaceholder[locale]}
                className={`${inputClasses} min-h-[110px] resize-y`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <p className="m-0 min-w-[200px] flex-1 text-[13px] text-on-green-soft">
                {form.note[locale]}
              </p>
              <button
                type="submit"
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-sand px-6 py-3 text-[15px] font-semibold text-green-deep transition-transform hover:-translate-y-px dark:text-[#1a2a20]"
              >
                <span>{form.send[locale]}</span>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M18 2.5 L2.5 8.6 L8.6 11.4 L11.4 17.5 L18 2.5 Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path d="M8.6 11.4 L18 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
