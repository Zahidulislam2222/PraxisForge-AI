# Privacy, data lifecycle and legal applicability

This guide describes implemented behavior and decisions an operator must make before accepting data. It is not a compliance certificate or a substitute for jurisdiction-specific review. Public service notices are available on the website's [privacy](https://praxisforge.zahidul-islam.com/legal/privacy/), [terms](https://praxisforge.zahidul-islam.com/legal/terms/), [cookies](https://praxisforge.zahidul-islam.com/legal/cookies/) and [accessibility](https://praxisforge.zahidul-islam.com/accessibility/) pages.

## Actual data flow

| Data                               | Use and location                                             | Current lifecycle                                                                      |
| ---------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Account email/password hash        | PostgreSQL authentication                                    | Owner-managed; no self-service account deletion                                        |
| Opaque session/CSRF hashes         | PostgreSQL; secure browser cookies hold token values         | Configured expiry; logout revokes; expired records cleaned on successful login         |
| Login-attempt key/time             | PostgreSQL security limiting                                 | Key hashes email/client address; older attempts cleaned on successful login            |
| Workspace text and source metadata | PostgreSQL evidence and selected model context               | Versioned active sources; deletion clears selected row content/removes retrieval       |
| Requests/drafts/recipient details  | Tasks, events, approvals, commitments, receipts and episodes | Retained business history; no complete automated purge/export workflow                 |
| Inference context/output           | Private local model and bounded application processing       | Temporary runtime handling; verify model/host logs and storage independently           |
| Edge/host request metadata         | Hosting/TLS/CDN infrastructure                               | Operator/provider settings; no claimed universal retention period                      |
| Database backups                   | Encrypted off-host artifacts                                 | Full dumps include authentication records; retention/deletion remains operator-managed |

The current configured session duration is eight hours. Duration is configurable; cookie expiry does not erase all historical business data. Source deletion is not complete erasure: older versions, drafts, events, receipts, episodes, logs and existing backups may contain derived or copied material. Do not promise immediate global deletion.

The application has no configured external email/CRM delivery or paid model fallback. Local inference reduces model-provider transfers but does not eliminate personal data processing: hosting, edge delivery, logs, browser storage and backups remain relevant. Cloudflare analytics injection is observed being blocked by CSP in the current browser checks; do not infer that the hosting/CDN handles no metadata. The app provides no optional-tracker consent manager.

## US applicability

Honor published privacy and security representations and use safeguards appropriate to the data; see the [FTC privacy/security guidance](https://www.ftc.gov/business-guidance/privacy-security). State privacy, breach-notification and sector-specific requirements need an applicability review. California's CCPA depends on statutory business thresholds and other conditions; it is not automatically applicable to every website. A conspicuous online privacy-policy duty can arise separately under CalOPPA. See the [California Attorney General CCPA guide](https://oag.ca.gov/privacy/ccpa) and [official CalOPPA explanation](https://oag.ca.gov/node/36676).

Do not use this release for protected health, children's or other specially regulated data without a separately assessed lawful operating arrangement and controls. It does not supply HIPAA agreements, children's onboarding or sector certification. Employment, credit, medical or similarly consequential automated decisions are outside the current supported workflow.

## EU applicability

Assess GDPR territorial scope, processing purpose and actual controller/processor roles before onboarding EU personal data. Hosting location alone does not determine applicability. Where relevant, document lawful basis, transparent notices, processor agreements, rights handling, storage limitation, appropriate security and lawful international transfer mechanisms. The release does not automatically provide a DPA, SCCs, DPIA, data-subject portal or transfer assessment. Refer to the [official GDPR text](https://eur-lex.europa.eu/eli/reg/2016/679/oj).

For a covered breach, [Article 33 guidance from the EDPB](https://www.edpb.europa.eu/sme/assess-the-risks/data-breaches_en) describes a supervisory-authority notification requirement without undue delay and, where feasible, within 72 hours after awareness, subject to its risk exception; assess Article 34 communication separately. This is not a blanket deadline for every event or jurisdiction. Before relying on this process, identify competent authority, escalation owner and evidence requirements.

Assess EU AI Act roles, intended use and applicable obligations rather than assigning a universal low-risk label. Human review and AI identification do not by themselves establish compliance. The Commission's [AI Act guidance](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) describes risk classes and transparency obligations; verify the current law/timeline for the deployment. Generated artifacts remain subject to human verification and applicable disclosure, copyright and contract duties.

## Operator checklist

Identify the legal operator and public contact, processing purposes, user population and jurisdictions. Inventory actual hosting/edge/backup providers, locations, contracts and transfer arrangements. Choose documented retention periods by data class; implement deletion/export verification before promising automation. Keep backup retention and restored-data deletion reconciliation consistent. Establish identity verification for rights requests, breach triage and a lawful response process. Reassess before enabling a connector or admitting unrelated customers.

Users must have permission to submit source material and use generated drafts. Model/dependency licenses and source rights are separate; see [third-party notices](../THIRD_PARTY_NOTICES.md). Accessibility testing uses WCAG 2.1 AA checks as a target, with no blanket conformance or ADA compliance claim. The maintained public contact is [muhammadzahidulislam2222@gmail.com](mailto:muhammadzahidulislam2222@gmail.com).
