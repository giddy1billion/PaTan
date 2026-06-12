import type { MetaFunction } from "react-router";
export const meta: MetaFunction = () => {
  return [
    { title: "User Data Deletion | PaTan™" },
    {
      name: "description",
      content:
        "How to request account and personal data deletion from PaTan™, including Facebook-connected account removal instructions.",
    },
  ];
};
export default function DataDeletion() {
  return (
    <main id="main-content" className="page-modern bg-dawn">
      {" "}
      <section className="bg-midnight text-dawn py-14 sm:py-16">
        {" "}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {" "}
          <h1 className="font-heading text-3xl sm:text-4xl font-bold">
            User Data Deletion
          </h1>{" "}
          <p className="mt-4 text-dawn/75">Last updated: June 2026</p>{" "}
        </div>{" "}
      </section>{" "}
      <section className="py-10 sm:py-12 lg:py-16">
        {" "}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {" "}
          <article className="space-y-8 rounded-2xl border border-midnight/10 bg-white p-6 sm:p-8 shadow-sm">
            {" "}
            <section className="space-y-3">
              {" "}
              <h2 className="font-heading text-2xl text-midnight font-bold">
                How to delete your PaTan™ data
              </h2>{" "}
              <p className="text-night/80 leading-relaxed">
                {" "}
                You can request deletion of your account and personal data at
                any time. This applies to accounts created directly on PaTan™
                and accounts connected through Facebook login.{" "}
              </p>{" "}
            </section>{" "}
            <section className="space-y-3">
              {" "}
              <h2 className="font-heading text-2xl text-midnight font-bold">
                Request steps
              </h2>{" "}
              <ol className="space-y-2 text-night/80 leading-relaxed list-decimal pl-6">
                {" "}
                <li>
                  Email privacy@PaTan™.site from the email address linked to
                  your PaTan™ account.
                </li>{" "}
                <li>Use the subject line: PaTan™ Data Deletion Request.</li>{" "}
                <li>
                  Include your account email and, if applicable, the provider
                  used to sign in (Facebook or Google).
                </li>{" "}
                <li>
                  We will verify your request and begin deletion processing.
                </li>{" "}
              </ol>{" "}
            </section>{" "}
            <section className="space-y-3">
              {" "}
              <h2 className="font-heading text-2xl text-midnight font-bold">
                Processing timeline
              </h2>{" "}
              <p className="text-night/80 leading-relaxed">
                {" "}
                We confirm receipt within 72 hours and complete deletion within
                30 days, unless retention is required by law, abuse prevention,
                or security obligations.{" "}
              </p>{" "}
            </section>{" "}
            <section className="space-y-3">
              {" "}
              <h2 className="font-heading text-2xl text-midnight font-bold">
                What gets deleted
              </h2>{" "}
              <ul className="space-y-2 text-night/80 leading-relaxed list-disc pl-6">
                {" "}
                <li>Profile details and linked authentication records.</li>{" "}
                <li>
                  Stories, aspirations, comments, and related user-generated
                  content tied to your account.
                </li>{" "}
                <li>
                  Associated account metadata not required for legal or security
                  purposes.
                </li>{" "}
              </ul>{" "}
            </section>{" "}
            <section className="space-y-3">
              {" "}
              <h2 className="font-heading text-2xl text-midnight font-bold">
                Contact
              </h2>{" "}
              <p className="text-night/80 leading-relaxed">
                {" "}
                Questions about deletion requests can be sent to{" "}
                <a
                  href="mailto:privacy@PaTan™.site"
                  className="text-golden hover:text-soft-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-golden focus-visible:ring-offset-2 rounded-sm"
                >
                  {" "}
                  privacy@PaTan™.site{" "}
                </a>{" "}
                .{" "}
              </p>{" "}
            </section>{" "}
          </article>{" "}
        </div>{" "}
      </section>{" "}
    </main>
  );
}
