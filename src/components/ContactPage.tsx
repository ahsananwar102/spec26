import React, { useState } from 'react';
import { saveContactMessage } from '../lib/store';

export const ContactPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [subjectCategory, setSubjectCategory] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactMessage({
      fullName,
      emailAddress,
      subjectCategory,
      messageBody
    });
    setSubmitted(true);
  };

  const resetForm = () => {
    setFullName('');
    setEmailAddress('');
    setSubjectCategory('');
    setMessageBody('');
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col w-full">
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16 w-full">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
            <span className="font-label-caps text-label-caps text-secondary tracking-widest uppercase">
              Get in Touch
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">
            Contact &amp; Location
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Have a question about registration, competition rules, or campus access? Reach out to the student organizing committee or visit the department.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Direct Inquiries Form Container */}
          <div className="lg:col-span-6 bg-surface-container-low rounded-xl p-8 md:p-10 shadow-xl relative overflow-hidden border border-outline-variant/30">
            <div className="mb-8">
              <h2 className="font-headline-md text-headline-md text-on-surface">Direct Inquiries</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                Fill out the form below and our team will route your question to the relevant event lead.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="fullName">
                  Full Name <span className="text-secondary">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container border border-outline-variant/30 transition-colors"
                  id="fullName"
                  placeholder="e.g. Ayesha Siddiqui"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="emailAddress">
                  Email Address <span className="text-secondary">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container border border-outline-variant/30 transition-colors"
                  id="emailAddress"
                  placeholder="e.g. yourname@domain.edu.pk"
                  required
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="subjectCategory">
                  Subject Category <span className="text-secondary">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md appearance-none focus:outline-none focus:bg-surface-container border border-outline-variant/30 transition-colors cursor-pointer"
                    id="subjectCategory"
                    required
                    value={subjectCategory}
                    onChange={(e) => setSubjectCategory(e.target.value)}
                  >
                    <option value="" disabled>Select category</option>
                    <option value="reg">Registration Inquiry</option>
                    <option value="rules">Competition Rules</option>
                    <option value="sponsor">Sponsorship / Media</option>
                    <option value="general">General Questions</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider" htmlFor="messageBody">
                  Message <span className="text-secondary">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-surface-container-lowest text-on-surface rounded-lg font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container border border-outline-variant/30 transition-colors resize-y min-h-[120px]"
                  id="messageBody"
                  placeholder="State your question clearly. For registration questions, please include your submission or team reference if applicable."
                  required
                  rows={5}
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                  className="inline-flex items-center justify-center gap-2 font-headline-sm text-headline-sm font-semibold px-8 py-3.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-all duration-200 active:scale-[0.98] shadow-md cursor-pointer"
                  type="submit"
                >
                  <span>Send Message</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>

              <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2 pt-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">info</span>
                <span>Our student committee typically responds within 24 to 48 hours.</span>
              </p>
            </form>

            {/* Success Overlay */}
            {submitted && (
              <div className="absolute inset-0 bg-surface-container-low/95 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface">Message Received</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  Thank you for reaching out. We have queued your message and assigned it to our event coordinators.
                </p>
                <button
                  className="px-5 py-2.5 rounded-lg bg-surface-container text-primary font-body-sm text-body-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  onClick={resetForm}
                  type="button"
                >
                  Submit Another Query
                </button>
              </div>
            )}
          </div>

          {/* Location & Department Protocols */}
          <div className="lg:col-span-6 space-y-10">
            {/* Department Headquarters */}
            <div className="bg-surface-container-low rounded-xl p-8 space-y-6 shadow-xl border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">
                  Departmental Headquarters
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">domain</span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Department of Electronic Engineering
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  NED University of Engineering &amp; Technology<br />
                  University Road, Karachi – 75270, Sindh, Pakistan
                </p>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  className="p-4 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col justify-between group"
                  href="mailto:spec@neduet.edu.pk"
                >
                  <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-primary group-hover:text-primary-container transition-colors">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <div className="mt-4">
                    <span className="block font-label-caps text-label-caps text-outline uppercase tracking-wider">
                      Email
                    </span>
                    <span className="block font-code-md text-code-md text-on-surface truncate mt-0.5">
                      spec@neduet.edu.pk
                    </span>
                  </div>
                </a>

                <a
                  className="p-4 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col justify-between group"
                  href="https://instagram.com"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-primary group-hover:text-primary-container transition-colors">
                    <span className="material-symbols-outlined text-[18px]">tag</span>
                  </div>
                  <div className="mt-4">
                    <span className="block font-label-caps text-label-caps text-outline uppercase tracking-wider">
                      Social
                    </span>
                    <span className="block font-code-md text-code-md text-on-surface truncate mt-0.5">
                      @spec26_neduet
                    </span>
                  </div>
                </a>

                <a
                  className="p-4 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex flex-col justify-between group"
                  href="tel:+922199261261"
                >
                  <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center text-primary group-hover:text-primary-container transition-colors">
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </div>
                  <div className="mt-4">
                    <span className="block font-label-caps text-label-caps text-outline uppercase tracking-wider">
                      Desk Phone
                    </span>
                    <span className="block font-code-md text-code-md text-on-surface truncate mt-0.5">
                      +92 21 99261261
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Campus Access Card */}
            <div className="bg-surface-container-low rounded-xl p-8 space-y-6 shadow-xl border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-secondary tracking-wider">
                    Campus Access
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                    Visitor &amp; Venue Protocol
                  </h3>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">location_on</span>
              </div>

              {/* Campus Visual Representation */}
              <div className="w-full h-44 bg-surface-container-lowest rounded-lg relative overflow-hidden flex flex-col justify-end p-4 border border-outline-variant/40 bg-tech-grid">
                <div className="absolute top-3 right-3 font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface-container-high text-primary border border-outline-variant/40">
                  KARACHI - 75270
                </div>
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-2 text-primary font-code-md text-code-md">
                    <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                    <span>NED Main Campus, University Road</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Electronic Engineering Dept. Complex &amp; Main Auditorium
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-4 p-3 rounded-lg bg-surface-container">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface text-[15px]">Main Gate Entry</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Access campus via the University Road main gate. Original CNIC or university student ID cards are required for entry verification by campus security.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-surface-container">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">apartment</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface text-[15px]">Exhibition &amp; Lab Venue</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Follow directional signboards to the Electronic Engineering Department new building, main auditorium, and designated specialized project labs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-surface-container">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">local_parking</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface text-[15px]">Parking Arrangements</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Designated visitor parking is arranged near the Central Library. Volunteer escorts will be stationed at key nodes to guide vehicles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-20 pt-16 border-t border-outline-variant/30">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="font-label-caps text-label-caps uppercase text-secondary tracking-widest">
              Common Questions
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Frequently Asked Questions</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Quick clarity on key participation guidelines before you reach out to the support desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 md:p-8 rounded-xl bg-surface-container-low shadow-lg flex flex-col justify-between space-y-4 border border-outline-variant/30">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">public</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Can teams from universities outside Karachi participate?
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Yes. SPEC'26 welcomes engineering and computer science students from all HEC-recognized institutions across Pakistan. Virtual preliminary presentations can be arranged for select software categories.
                </p>
              </div>
              <span className="font-code-md text-code-md text-secondary">NATIONWIDE ACCESS</span>
            </div>

            <div className="p-6 md:p-8 rounded-xl bg-surface-container-low shadow-lg flex flex-col justify-between space-y-4 border border-outline-variant/30">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">layers</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Can I register for more than one category?
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Yes, students may take part in up to two different competitions, provided their live presentation and evaluation slots do not clash according to the final published event schedule.
                </p>
              </div>
              <span className="font-code-md text-code-md text-secondary">MULTI-CATEGORY</span>
            </div>

            <div className="p-6 md:p-8 rounded-xl bg-surface-container-low shadow-lg flex flex-col justify-between space-y-4 border border-outline-variant/30">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">build</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">
                  Are lab tools provided for hardware competitions?
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Yes. Standard testbenches with digital oscilloscopes, regulated DC power supplies, multimeters, and soldering stations will be provided inside the Electronic Engineering department laboratories.
                </p>
              </div>
              <span className="font-code-md text-code-md text-secondary">HARDWARE READY</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
