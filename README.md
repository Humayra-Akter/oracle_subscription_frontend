Oracle Subscription Compliance System — Development Notes

1. Core idea

Build a web-based admin system that takes Oracle-generated reports, processes them automatically, and shows dashboards for:

active vs inactive users
underutilized vs overutilized subscriptions
total transactions
license waste
savings opportunities
compliance risks
upload/import history
report exports

The goal is to replace manual Excel analysis with an automated system.

2. Main business purpose

The system should help a company:

reduce Oracle subscription waste
identify unused or low-value licenses
detect risky role assignments
support audit/compliance checks
optimize renewal and budgeting decisions
centralize all uploaded Oracle reports in one place 3. MVP scope

Build the first version for 1 admin user only.

MVP pages
Login
Dashboard
Upload Center
Imports History
Users Analysis
Cost Optimization
Compliance
Reports / Export 4. Main features
A. Authentication
single admin login
secure password handling
protected routes
B. Upload Center
upload CSV/XLSX files
drag and drop upload
file type validation
upload status
accepted report categories
C. Imports History
see all uploaded files
filter by date/status/type
reprocess file
delete file
view processing result
D. Data processing
parse Oracle reports
normalize columns
map files into internal tables
store upload logs
handle duplicate uploads
mark failed imports with reason
E. Dashboard
total licensed users
active users
inactive users
estimated wasted spend
potential savings
active vs inactive trend
utilization breakdown
monthly transaction chart
compliance alerts
recent uploads
F. Users Analysis
list all users
search/filter users
show last activity
show transaction count
show assigned roles
show utilization status
identify inactive privileged users
G. Cost Optimization
cost leakage
top savings opportunities
inactive license cost
underutilized user cost
subscribed vs used summary
H. Compliance
risky admin roles
inactive users with high privilege
terminated users still assigned access
orphan license accounts
flagged exceptions
I. Reports / Export
export summary as CSV/PDF
export flagged users
export savings report
export compliance report 5. Reports/files expected from client

These are the main input documents:

SaaS service usage metrics drill through report
All roles report
User role membership report
Inactive users report
User last transaction report
Oracle subscribed services price list
Products and services global price list
HR master data 6. What to do before coding

This is very important.

First tasks
collect one sample of each report
inspect columns of every file
identify common user key
define file mapping rules
define business formulas
decide required dashboard KPIs
confirm what counts as active/inactive/underutilized
Must define early
how to identify a user across files
how to calculate inactivity
how to calculate underutilization
how to calculate savings
how to classify risky roles
how to handle unmatched rows 7. Suggested system flow
Upload flow
Admin uploads Oracle report
System validates file
File saved to storage
Parser reads file
Data normalized
Records saved in database
Metrics recalculated
Dashboard updated
Import logged in history 8. Suggested modules in backend
Module list
Auth module
User module
Upload module
Import history module
File parser module
Analytics module
Cost engine module
Compliance engine module
Reports/export module
Dashboard module 9. Recommended tech stack

Frontend
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Recharts
Backend
Node.js
Express.js or NestJS
Database
PostgreSQL
ORM
Prisma
File upload
Multer
or
presigned upload with S3/R2
File parsing
xlsx
csv-parse
papaparse if needed frontend-side preview only
Queue / background processing
BullMQ
Redis
Auth
JWT
or
NextAuth/Auth.js
Storage
AWS S3
or
Cloudflare R2
Deployment
Vercel for frontend
Railway / Render for backend
Neon / Railway Postgres
Upstash Redis 10. Database tables likely need
Core tables
users
roles
role_memberships
departments
subscriptions
pricing
transactions
activity_logs
uploaded_files
import_sessions
compliance_flags
savings_opportunities
dashboard_snapshots 11. Main calculations to build

These are the business outputs.

User metrics
active users
inactive users
dormant users
last activity age
total transactions by user
Utilization metrics
underutilized
optimal
overutilized
Cost metrics
estimated wasted spend
potential savings
inactive subscription cost
low-usage subscription cost
Compliance metrics
inactive high-privilege users
terminated active accounts
unused admin roles
orphan license accounts 12. Important corner cases

Do not forget these.

same user appears differently across files
missing employee ID
duplicated rows
bad date format
empty transactions
inactive report conflicts with last transaction report
file re-upload of same month
price list missing service
unmatched user in HR master
terminated employee still active in role report 13. Development order

Best order to build:

Phase 1
project setup
auth
DB schema
layout/sidebar/header
Phase 2
file upload
file storage
import history
parsing basic CSV/XLSX
Phase 3
map main input files
save normalized data
create basic metrics engine
Phase 4
build dashboard
build users analysis
build cost optimization
build compliance page
Phase 5
export reports
reprocessing
validation messages
polish and testing 14. Minimum deliverables

By MVP completion, the app should allow:

login as admin
upload Oracle reports
store upload history
process files into DB
show dashboard KPIs
show user analysis
show savings analysis
show compliance alerts
export reports 15. Nice-to-have later

Not needed now, but future-ready.

multi-user roles
company-based multi-tenant system
scheduled imports
email alerts
AI recommendations
anomaly detection
direct Oracle integration
audit log page
settings page for custom thresholds 16. One-line product definition

A web application that automates Oracle subscription usage analysis, cost optimization, and compliance monitoring from uploaded Oracle reports.

17. Simple build summary

You are not building just a dashboard.
You are building:

a file ingestion system
a data normalization layer
an analytics engine
a compliance/risk checker
a cost optimization dashboard
a reporting tool

---

Oracle Subscription Compliance System with AI-Assisted Ingestion, Analytics, and Decision Support

A web-based admin platform that ingests Oracle-generated reports, validates and normalizes them, calculates usage, cost, and compliance metrics, and then adds an AI/ML layer to improve classification, anomaly detection, risk scoring, and action recommendations. The system should still rely on deterministic business rules for core compliance and cost decisions, while AI improves speed, accuracy, and insight for future processes.

Revised system flow
Stage 1: File ingestion

Admin uploads CSV/XLSX files from the Upload Center. The system validates format, file type, size, and selected report category, then stores the raw file and creates an import session.

Stage 2: Deterministic parsing and normalization

A parser reads each file, validates required headers, standardizes columns, resolves user keys, removes duplicates, handles date issues, and maps data into internal tables. This remains rule-based because it must be auditable and stable.

Stage 3: AI-assisted document understanding

AI can help where rules alone are brittle:

suggest report type if the wrong category was selected
suggest column mappings when headers differ
identify probable user key matches when IDs are inconsistent
summarize parsing errors in plain language
classify unmatched rows into likely causes
Stage 4: Core analytics engine

The system calculates active vs inactive users, underutilized vs overutilized subscriptions, wasted spend, potential savings, and compliance exceptions using business formulas and threshold rules already planned in your notes.

Stage 5: ML intelligence layer

ML models or statistical detection can then score:

anomaly risk in usage patterns
probability of subscription waste
likelihood that a role assignment is risky
likelihood that an inactive user should be flagged urgently
probability that a row is misclassified or mapped incorrectly
Stage 6: AI recommendation layer

A recommendation engine explains what to do next:

revoke or review certain roles
downgrade or remove inactive licenses
investigate a department with abnormal usage
review duplicate uploads
verify possible HR mismatches
suggest reprocessing if parser confidence is low
Stage 7: Feedback loop

When the admin accepts, rejects, or edits an AI suggestion, the action is stored. That feedback becomes training data for future model improvement.

Best architecture for your app

1. Rules engine first

This is your source of truth. It handles required columns, duplicate rules, inactivity logic, savings formulas, and compliance logic.

2. ML models second

These should assist, not override, the rules engine. Good model types for your case:

anomaly detection for unusual user activity or cost spikes
classification for risky role patterns
entity matching for inconsistent user identifiers across files
recommendation ranking for savings opportunities 3. LLM layer third

Use an LLM only for human-facing tasks:

explain errors
summarize imports
generate “why flagged” notes
produce action summaries for managers
help map unfamiliar report columns

That is the safest and most useful order.

New AI/ML pipeline design

You can describe the revised pipeline like this in your project notes:

Upload → Validate → Parse → Normalize → Match identities → Calculate metrics → Detect anomalies → Score risk → Generate recommendations → Human review → Save decisions → Improve models

This makes the AI useful for further process because it is not just showing insights, it is helping the system become better at future imports, matching, exception handling, and decision support.

New backend modules to add

Your current planned modules already include auth, upload, import history, analytics, cost engine, compliance engine, and reports. Add these AI-ready modules:

ml-pipeline — orchestrates model calls after parsing
entity-resolution — matches user identities across files
anomaly-engine — detects unusual usage, cost, and compliance patterns
recommendation-engine — ranks savings and remediation actions
ai-explainer — turns system output into readable business explanations
feedback-learning — stores admin feedback on AI outputs for future tuning

This sits cleanly on top of your current module structure.

New database tables to prepare

Add a few future-ready tables:

model_runs
model_predictions
entity_match_candidates
anomaly_events
risk_scores
recommendations
recommendation_feedback
explanations
feature_snapshots

These do not have to be fully active in MVP, but designing for them now will save rework later.

What should be visible in the app

Yes, part of the AI pipeline should be visible.

Upload Center

Show:

upload status
parsing status
mapping confidence
validation errors
AI-assisted column suggestions
duplicate probability warning
Imports History

Show:

deterministic result
AI confidence score
anomaly flag
explanation of failures
recommended reprocess or mapping fix
Dashboard

Show:

anomaly alerts
top predicted savings opportunities
risk-scored compliance issues
confidence-aware trend summaries
Users Analysis / Compliance / Cost pages

Show:

risk score
anomaly score
recommendation
reason summary
“rule-based” vs “AI-assisted” label

Do not hide everything behind the backend. The admin should see what the AI thinks, how confident it is, and whether the result came from hard rules or predictive logic.

Good statuses for the app

Instead of only Queued, Processing, Completed, Failed, make the pipeline more informative:

Queued
Validating
Parsing
Normalizing
Matching Identities
Calculating Metrics
Running AI Checks
Recommendation Ready
Completed
Failed
Needs Human Review

That will make the app feel much more professional and useful.

Practical MVP vs future split
MVP
upload files
parse files
normalize data
calculate deterministic metrics
log import history
show dashboards
add simple anomaly rules, not full ML yet
Phase 2
entity matching model
anomaly detection model
compliance risk scoring
savings recommendation ranking
AI-generated explanations
Phase 3
feedback learning
automated threshold tuning
smarter reprocessing suggestions
scheduled forecasting and renewal optimization

---

src/
components/
Sidebar.jsx
layouts/
AppLayout.jsx
pages/
Dashboard.jsx
UploadCenter.jsx
ImportsHistory.jsx
UsersAnalysis.jsx
CostOptimization.jsx
Compliance.jsx
Reports.jsx
Login.jsx
App.jsx
main.jsx

oracle_subscription_backend/
├── prisma/
│ ├── migrations/
│ └── schema.prisma
├── src/
│ ├── config/
│ │ └── prisma.js
│ ├── middlewares/
│ │ ├── auth.middleware.js
│ │ ├── error.middleware.js
│ │ └── upload.middleware.js
│ ├── modules/
│ │ ├── auth/
│ │ │ ├── auth.controller.js
│ │ │ ├── auth.routes.js
│ │ │ ├── auth.service.js
│ │ │ ├── auth.validation.js
│ │ │ └── auth.utils.js
│ │ ├── file/
│ │ │ ├── file.controller.js
│ │ │ ├── file.routes.js
│ │ │ ├── file.service.js
│ │ │ ├── file.validation.js
│ │ │ └── file.utils.js
│ │ ├── dashboard/
│ │ │ ├── dashboard.controller.js
│ │ │ ├── dashboard.routes.js
│ │ │ └── dashboard.service.js
│ │ ├── users-analysis/
│ │ │ ├── usersAnalysis.controller.js
│ │ │ ├── usersAnalysis.routes.js
│ │ │ └── usersAnalysis.service.js
│ │ ├── compliance/
│ │ │ ├── compliance.controller.js
│ │ │ ├── compliance.routes.js
│ │ │ └── compliance.service.js
│ │ ├── cost-optimization/
│ │ │ ├── costOptimization.controller.js
│ │ │ ├── costOptimization.routes.js
│ │ │ └── costOptimization.service.js
│ │ ├── import-history/
│ │ │ ├── importHistory.controller.js
│ │ │ ├── importHistory.routes.js
│ │ │ └── importHistory.service.js
│ │ │ └── importHistory.validation.js
│ │ └── reports/
│ │ ├── reports.controller.js
│ │ ├── reports.routes.js
│ │ └── reports.service.js
│ ├── routes/
│ │ └── index.js
│ ├── utils/
│ │ ├── apiError.js
│ │ ├── asyncHandler.js
│ │ ├── jwt.js
│ │ └── response.js
│ ├── app.js
│ └── server.js
├── .env
├── package.json
└── prisma.config.ts
