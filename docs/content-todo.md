# Content Integrity Audit & Review Log (NFR-8)

Per the Bilunex SRS v1.0, all public website claims, commitments, and statistics must be accurate and verifiable. This document records flagged items that require client/stakeholder review and verification before production deployment.

---

## 1. Flagged Claims & Commitments

### 1.1 "Growth Passport"

- **Location**: `client/public/about.html` (approx. line 145)
- **Flagged Content**: References to a "Growth Passport" tracking system or methodology.
- **Concern**: The Growth Passport concept is not specified in the SRS v1.0. If this is a trademarked program, proprietary framework, or planned future feature, verify whether it should be mentioned or replaced with verified curriculum terminology.
- **Action Required**: Stakeholder sign-off on keeping the term or replacing it with generic academic progress tracking descriptions.

### 1.2 "Within 24 Hours" Response SLA

- **Location**: `client/public/for-parents.html` (line 55), `client/js/pages/home.js` (line 14)
- **Flagged Content**: "We respond within 24 hours to schedule an initial diagnostic conversation."
- **Concern**: Creates an explicit, customer-facing operational SLA. If operations cannot guarantee a 24-hour turnaround on weekends or peak periods, this claim may risk breach of promise.
- **Action Required**: Operations team must confirm whether this SLA is realistic or if phrasing should be "typically within 1–2 business days".

### 1.3 "Rigorous self-evaluation standards"

- **Location**: `client/public/services.html` (line 79), `client/public/for-parents.html` (line 93)
- **Flagged Content**: Claims regarding formal self-evaluation frameworks and standards.
- **Concern**: Verify if an actual formal evaluation instrument or scoring rubric exists and is documented, or if this should be rephrased to accurately describe mentor-led student reflection.
- **Action Required**: Clarify whether formal rubric documentation exists.

---

## 2. Infrastructure & Environment Placeholders

### 2.1 Production Hosting & Domain

- **Location**: Global configuration / CORS setup
- **Flagged Content**: Localhost / default port fallbacks in development environment.
- **Concern**: Production domain names (e.g. `bilunex.org` / `bilunex.et`), production TLS certificates, and hosting setup need official provision.
- **Action Required**: Deployment team must provide production environment variables (`NODE_ENV=production`, `PORT`, `CORS_ORIGIN`, `COOKIE_DOMAIN`).

---

## 3. Policy on Content Modifications

As dictated by project requirements, existing wording on the public frontend has been preserved during this functionality repair stage. No marketing copy has been unilaterally altered without explicit stakeholder approval.
