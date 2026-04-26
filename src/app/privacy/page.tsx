import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Pinsora",
  description: "Pinsora Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-black text-neutral-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-neutral-400 mb-10">Last updated: April 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8">
        {[
          {
            title: "1. Information We Collect",
            content: "We collect information you provide directly to us, such as your name, email address, and password when you create an account. We also collect information about how you use Pinsora, including images you upload, boards you create, and interactions with content.",
          },
          {
            title: "2. How We Use Your Information",
            content: "We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices and support messages, and respond to your comments and questions.",
          },
          {
            title: "3. Image Storage",
            content: "Images uploaded to Pinsora are stored securely on Cloudflare R2 infrastructure. We only store the URL reference to your images in our database. You retain ownership of all content you upload.",
          },
          {
            title: "4. Data Security",
            content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
          },
          {
            title: "5. Cookies",
            content: "We use cookies and similar tracking technologies to track activity on our service and hold certain information for authentication and session management purposes.",
          },
          {
            title: "6. Third-Party Services",
            content: "We use third-party services including Supabase (database), Cloudflare R2 (storage), and Vercel (hosting). These services have their own privacy policies.",
          },
          {
            title: "7. Contact Us",
            content: "If you have any questions about this Privacy Policy, please contact us at privacy@pinsora.com.",
          },
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
