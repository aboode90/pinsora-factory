import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Pinsora",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-black text-neutral-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-neutral-400 mb-10">Last updated: April 2026</p>

      <div className="space-y-8">
        {[
          { title: "1. Acceptance of Terms", content: "By accessing and using Pinsora, you accept and agree to be bound by the terms and provision of this agreement." },
          { title: "2. User Accounts", content: "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account." },
          { title: "3. Content Policy", content: "You may not upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. We reserve the right to remove any content that violates these terms." },
          { title: "4. Intellectual Property", content: "You retain ownership of content you upload to Pinsora. By uploading content, you grant Pinsora a non-exclusive license to display and distribute your content on the platform." },
          { title: "5. Prohibited Activities", content: "You agree not to use Pinsora for any unlawful purpose, to spam other users, to attempt to gain unauthorized access to any part of the service, or to interfere with the proper working of the service." },
          { title: "6. Termination", content: "We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our sole discretion." },
          { title: "7. Contact", content: "For questions about these Terms, contact us at legal@pinsora.com." },
        ].map(({ title, content }) => (
          <div key={title}>
            <h2 className="text-lg font-bold text-neutral-900 mb-2">{title}</h2>
            <p className="text-neutral-600 leading-relaxed">{content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
