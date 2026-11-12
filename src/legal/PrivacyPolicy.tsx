import { Link } from "react-router-dom";
import LegalLayout, { LegalSectionBlock } from "./LegalLayout";

const linkClass = "font-medium text-[#2C6E49] hover:underline";

const sections = [
  { id: "intro", heading: "1. Who We Are" },
  { id: "collect", heading: "2. Information We Collect" },
  { id: "google", heading: "3. Sign in with Google" },
  { id: "use", heading: "4. How We Use Information" },
  { id: "legal-basis", heading: "5. Legal Basis" },
  { id: "sharing", heading: "6. How We Share Information" },
  { id: "third-party", heading: "7. Service Providers" },
  { id: "transfers", heading: "8. International Transfers" },
  { id: "security", heading: "9. Data Security" },
  { id: "retention", heading: "10. Data Retention" },
  { id: "rights", heading: "11. Your Rights" },
  { id: "cookies", heading: "12. Cookies & Local Storage" },
  { id: "children", heading: "13. Children's Privacy" },
  { id: "changes", heading: "14. Changes to This Policy" },
  { id: "contact", heading: "15. Contact & Complaints" },
];

const PrivacyPolicy = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="November 8, 2026"
      intro="This Privacy Policy explains what personal information AgriSense collects, why we collect it, who we share it with, and the choices and rights you have. It applies to our website (agrisense.rw), our mobile app, and our API."
      sections={sections}
    >
      <LegalSectionBlock id="intro" heading="1. Who We Are">
        <p>
          AgriSense ("we", "us", "our") is a smart-farming platform based in Nyabihu, Rwanda. We
          provide crop and soil insights, weather information, a farming community, a marketplace,
          and related services to farmers, suppliers, cooperatives, NGOs, and government partners.
        </p>
        <p>
          For the personal information described in this policy, AgriSense is the data controller
          under Law No. 058/2021 of 13 October 2021 relating to the protection of personal data and
          privacy in Rwanda. By using AgriSense you acknowledge this policy and our{" "}
          <Link to="/legal/terms" className={linkClass}>
            Terms of Service
          </Link>
          .
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="collect" heading="2. Information We Collect">
        <p>We collect the following categories of information.</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>Account information:</strong> your name, email address, phone number, role
            (for example farmer, supplier, or partner organization), profile image, and a password
            stored only in hashed form. If you sign in with Google, we receive your Google name,
            email address, and profile picture (see section 3).
          </li>
          <li>
            <strong>Identity verification data:</strong> where you choose to verify your identity,
            your national ID number or other document type and a photo of that document. We use this
            only to verify your account and prevent fraud, and we do not show it to other users.
          </li>
          <li>
            <strong>Farm and agricultural data:</strong> farm names, locations and coordinates,
            size, soil type, crops, planting details, prediction inputs, and the results and
            recommendations we generate for you.
          </li>
          <li>
            <strong>Photos and scans:</strong> soil or crop images you upload for analysis.
          </li>
          <li>
            <strong>Location data:</strong> approximate or precise location, only with your
            permission, to provide local weather and recommendations. You can withdraw permission
            in your device or browser settings at any time.
          </li>
          <li>
            <strong>User content:</strong> community posts, comments, reactions, messages, and
            images you submit.
          </li>
          <li>
            <strong>Orders and payment records:</strong> marketplace orders, subscription and
            season-pass details, and payment references, amounts, and status. We do not store your
            full card number or mobile-money PIN; payments are handled by our payment partners.
          </li>
          <li>
            <strong>Usage and device data:</strong> log data, IP address, browser or device type,
            app version, and interactions used to operate, secure, and improve the Service.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="google" heading="3. Sign in with Google">
        <p>
          You can create an account or sign in using your Google account. When you do, Google shares
          with us only your name, email address, and profile picture. We use them to create and
          identify your AgriSense account and for no other purpose.
        </p>
        <p>
          We do not access your Google contacts, Gmail, Drive, or any other Google data. We do not
          sell Google user data, use it for advertising, or transfer it to others except as needed to
          provide the Service or to comply with law. AgriSense's use of information received from
          Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Google API Services User Data Policy
          </a>
          , including its Limited Use requirements. You can revoke AgriSense's access at any time
          from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Google Account permissions
          </a>{" "}
          page.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="use" heading="4. How We Use Information">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Create and secure your account, and verify your identity where required.</li>
          <li>Provide crop, soil, and weather insights and generate recommendations.</li>
          <li>Operate the community, messaging, and marketplace features.</li>
          <li>Process subscriptions, season passes, and orders, and keep financial records.</li>
          <li>Send service messages such as verification codes, receipts, and security alerts.</li>
          <li>Provide support and respond to your requests.</li>
          <li>Detect and prevent fraud, abuse, and violations of our Terms.</li>
          <li>
            Improve the Service, including model accuracy, using aggregated or de-identified data
            where possible.
          </li>
          <li>Comply with legal obligations.</li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="legal-basis" heading="5. Legal Basis">
        <p>We process personal data on one or more of these grounds:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>Consent</strong> — for example, location access and optional identity
            verification. You may withdraw consent at any time.
          </li>
          <li>
            <strong>Contract</strong> — to provide the Service you signed up for.
          </li>
          <li>
            <strong>Legitimate interests</strong> — to secure and improve the Service, where these
            interests are not overridden by your rights.
          </li>
          <li>
            <strong>Legal obligation</strong> — to meet requirements under Rwandan law.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="sharing" heading="6. How We Share Information">
        <p>We do not sell your personal information. We share it only as follows:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>
            <strong>Other users,</strong> when you choose to post publicly or message someone, or
            place an order with a supplier (who receives the details needed to fulfil it).
          </li>
          <li>
            <strong>Service providers</strong> that process data on our behalf under confidentiality
            and data-protection obligations (see section 7).
          </li>
          <li>
            <strong>Partner organizations</strong> such as cooperatives, NGOs, or government
            programs, only where you have joined their program or agreed to the sharing, or in
            aggregated form that does not identify you.
          </li>
          <li>
            <strong>Authorities,</strong> where required by law, court order, or to protect rights,
            safety, and security.
          </li>
          <li>
            <strong>A successor,</strong> in connection with a merger, acquisition, or transfer of
            the Service, with notice to you.
          </li>
        </ul>
      </LegalSectionBlock>

      <LegalSectionBlock id="third-party" heading="7. Service Providers">
        <p>We rely on trusted providers to run AgriSense, including for:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Hosting and database infrastructure.</li>
          <li>Image storage for profile photos, ID documents, and scans.</li>
          <li>Weather data and map or geocoding services — coordinates you search for or share may be sent to them.</li>
          <li>Payment processing, including mobile money and cards, through Flutterwave.</li>
          <li>Email delivery for verification codes and notifications.</li>
          <li>Google, for optional sign-in.</li>
        </ul>
        <p>
          These providers may use your data only to perform services for us, and their own handling
          of data is governed by their privacy policies.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="transfers" heading="8. International Transfers">
        <p>
          Some of our providers operate outside Rwanda, so your information may be stored or
          processed in other countries. Where we transfer personal data abroad, we do so in line with
          Law No. 058/2021, which requires appropriate safeguards or your consent.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="security" heading="9. Data Security">
        <p>
          We use technical and organizational measures to protect your information, including
          encrypted connections (HTTPS), hashed passwords, short-lived access tokens, and
          role-based access controls so staff and partners see only what they need. No method of
          transmission or storage is completely secure, so we cannot guarantee absolute security.
          If a breach is likely to put your rights at risk, we will notify you and the competent
          authority as required by law.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="retention" heading="10. Data Retention">
        <p>
          We keep your information while your account is active and for as long as needed to provide
          the Service. After you delete your account we remove or anonymize your personal data,
          except where we must keep it longer — for example, financial and payment records for
          accounting and tax purposes, or data needed to resolve disputes, prevent fraud, or comply
          with the law. Backups are overwritten on a rolling basis.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="rights" heading="11. Your Rights">
        <p>Under Rwandan law you have the right to:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>Be informed about how your data is used, and access your personal data.</li>
          <li>Correct inaccurate or incomplete data.</li>
          <li>Request deletion of your data, where there is no overriding reason to keep it.</li>
          <li>Object to, or ask us to restrict, certain processing.</li>
          <li>Withdraw consent at any time, without affecting earlier processing.</li>
          <li>Receive a copy of your data in a portable format.</li>
          <li>Not be subject to a decision based solely on automated processing that significantly affects you.</li>
        </ul>
        <p>
          You can manage much of your profile in your account settings. To exercise any right,
          contact us using the details below; we will respond within the time required by law, and
          may need to verify your identity first.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="cookies" heading="12. Cookies & Local Storage">
        <p>
          We use browser storage (such as local and session storage) to keep you signed in, remember
          preferences, and run core features. We do not use it for third-party advertising. You can
          clear this data in your browser, but some features may stop working.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="children" heading="13. Children's Privacy">
        <p>
          AgriSense is not directed to children under 18, and we do not knowingly collect their
          personal data. If you believe a child has given us information, contact us and we will
          delete it.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="changes" heading="14. Changes to This Policy">
        <p>
          We may update this policy from time to time. We will post the new version here with a
          revised "Last updated" date and, for material changes, notify you in the app or by email
          before they take effect.
        </p>
      </LegalSectionBlock>

      <LegalSectionBlock id="contact" heading="15. Contact & Complaints">
        <p>
          For privacy questions or to exercise your rights, contact us at{" "}
          <a href="mailto:agrisense8@gmail.com" className={linkClass}>
            agrisense8@gmail.com
          </a>{" "}
          or by post at AgriSense, Nyabihu, Rwanda.
        </p>
        <p>
          If you are not satisfied with our response, you have the right to lodge a complaint with
          the National Cyber Security Authority (NCSA), Rwanda's supervisory authority for personal
          data protection.
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
};

export default PrivacyPolicy;
