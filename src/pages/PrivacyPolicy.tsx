import wakilGoldLogo from "@/assets/wakil-gold.png";
import { Body, Heading } from "@/components/ui";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <img src={wakilGoldLogo} alt="Wakil Security" className="size-32 mb-6" />
          <Heading size="xl">Privacy Policy</Heading>
          <Body className="text-muted-foreground mt-1">
            Wakil Guards – Security Guard Mobile App
          </Body>
          <Body size="sm" className="text-muted-foreground mt-1">
            Effective date: June 26, 2026 &nbsp;·&nbsp; Last updated: June 26, 2026
          </Body>
        </div>

        <Body className="mb-8">
          Wakil Security Limited ("we", "us", or "our") operates the{" "}
          <strong>Wakil Guards</strong> mobile application (the "App"). This policy explains what
          information we collect, why we collect it, and how it is used. By using the App you
          agree to the practices described here.
        </Body>

        <Section title="1. Who This App Is For">
          <Body>
            Wakil Guards is a professional tool used exclusively by employed security guards
            working under contracts with Wakil Security Limited. It is not a consumer app and is
            not intended for use by the general public or by minors.
          </Body>
        </Section>

        <Section title="2. Information We Collect">
          <Body className="font-semibold mb-2">Account &amp; Profile Data</Body>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
            <li>Full name, phone number, and employee ID provided during onboarding</li>
            <li>Profile photo taken via camera or selected from your gallery</li>
            <li>Employment site and shift assignments managed by your supervisor</li>
          </ul>

          <Body className="font-semibold mb-2">Location Data</Body>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
            <li>Precise GPS location while you are clocked in for a shift, including in the background</li>
            <li>Location is used to show dispatch your real-time position and to verify patrol routes</li>
            <li>Background location collection stops when you clock out or end your shift</li>
          </ul>

          <Body className="font-semibold mb-2">Incident &amp; Patrol Reports</Body>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
            <li>Photos you capture or attach to incident reports</li>
            <li>Text descriptions and timestamps for patrol check-ins and incidents</li>
          </ul>

          <Body className="font-semibold mb-2">Device &amp; Technical Data</Body>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Push notification token to deliver dispatch alerts to your device</li>
            <li>App version, OS version, and device model for debugging and support</li>
            <li>Connection events to maintain real-time presence during shifts</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Display your live location to authorised dispatch operators during active shifts</li>
            <li>Send you real-time alerts and dispatch instructions via push notifications</li>
            <li>Record incident reports and patrol logs for operational and legal compliance</li>
            <li>Verify attendance, patrol completion, and shift compliance</li>
            <li>Diagnose technical issues and improve app stability</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <Body className="mb-3">We do not sell your personal data. We share data only as follows:</Body>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>
              <strong>Authorised dispatch staff</strong> – see your live location and status during shifts
            </li>
            <li>
              <strong>Client site managers</strong> – may receive incident reports and patrol logs relating to their site
            </li>
            <li>
              <strong>Service providers</strong> – cloud hosting and push notification delivery (Firebase Cloud Messaging). These providers process data on our behalf under confidentiality agreements
            </li>
            <li>
              <strong>Legal obligations</strong> – if required by law, court order, or to protect the safety of persons
            </li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Location history is retained for 90 days, then automatically deleted</li>
            <li>Incident reports and patrol logs are retained for 12 months or as required by client contracts</li>
            <li>Account data is retained while employment is active and for 30 days after termination</li>
          </ul>
        </Section>

        <Section title="6. Data Security">
          <Body>
            All data is transmitted over encrypted connections (HTTPS/TLS). Access to backend
            systems is restricted to authorised personnel. We regularly review security practices
            to protect your information from unauthorised access, loss, or disclosure.
          </Body>
        </Section>

        <Section title="7. Your Rights">
          <Body className="mb-3">Depending on your location, you may have the right to:</Body>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (subject to legal retention obligations)</li>
            <li>Object to certain processing activities</li>
          </ul>
          <Body>
            To exercise any of these rights, contact us at{" "}
            <a href="mailto:privacy@wakilsecurity.com" className="text-primary underline underline-offset-4">
              privacy@wakilsecurity.com
            </a>
            .
          </Body>
        </Section>

        <Section title="8. Permissions Explained">
          <Body className="mb-3">The App requests the following device permissions:</Body>
          <div className="space-y-3">
            {[
              { label: "Location (Always)", desc: "Required to track your patrol route in the background while on duty" },
              { label: "Camera", desc: "Required to capture photos for incident reports" },
              { label: "Photo Library", desc: "Required to attach existing photos to incident reports or set your profile picture" },
              { label: "Notifications", desc: "Required to receive dispatch alerts and shift updates" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex gap-3">
                <span className="shrink-0 bg-card border border-border rounded px-2 py-0.5 text-xs text-muted-foreground h-fit mt-0.5">
                  {label}
                </span>
                <Body size="sm" className="text-muted-foreground">{desc}</Body>
              </div>
            ))}
          </div>
        </Section>

        <Section title="9. Children's Privacy">
          <Body>
            The App is intended solely for employed adults. We do not knowingly collect data from
            anyone under the age of 18.
          </Body>
        </Section>

        <Section title="10. Changes to This Policy">
          <Body>
            We may update this policy from time to time. We will notify you of material changes
            through the App or by other means. Continued use of the App after changes take effect
            constitutes acceptance of the updated policy.
          </Body>
        </Section>

        <Section title="11. Contact Us">
          <Body>
            Wakil Security Limited
            <br />
            Email:{" "}
            <a href="mailto:privacy@wakilsecurity.com" className="text-primary underline underline-offset-4">
              privacy@wakilsecurity.com
            </a>
          </Body>
        </Section>

        <div className="mt-12 pt-8 border-t border-border">
          <Body size="sm" className="text-muted-foreground">
            &copy; 2026 Wakil Security Limited. All rights reserved.
          </Body>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}
