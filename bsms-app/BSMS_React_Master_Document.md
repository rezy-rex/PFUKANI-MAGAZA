# Burial Society Management System
## Project Master Document — React + Supabase Edition
**Version:** 3.0
**Client:** Pfukani Magaza Burial Society
**Stack:** React + Vite · Tailwind CSS · Supabase · Netlify
**Purpose:** WIL academic project — Work Integrated Learning submission

---

## Table of Contents

1. Project Overview
2. Goals and Success Definition
3. Technology Stack
4. System Architecture
5. Database Schema and Design
6. Row Level Security Strategy
7. Feature Specifications
8. Component Architecture
9. Routing and Navigation
10. State Management
11. Security and POPIA Compliance
12. Error Handling Strategy
13. UI and UX Standards
14. Development Phases and Checkpoints
15. What to Avoid
16. Deployment

---

## 1. Project Overview

### 1.1 Background

Pfukani Magaza Burial Society is a community-based organisation registered as an NPO/NPC with the Companies and Intellectual Property Commission (CIPC) in South Africa. The organisation provides financial and logistical support to member families in the event of a member's death.

The organisation has 6 Directors, 32 Executives, and over 400 registered members. Each member pays a monthly contribution of R200, which covers up to 10 beneficiaries per membership.

All operations are currently conducted on paper. This project replaces the paper system entirely with a web application.

### 1.2 The Problem Being Solved

The organisation cannot efficiently manage 400+ members using physical ledgers. Specific problems include lost or damaged records, payment tracking disputes, no formal claim workflow, no way to generate reports, and members having no visibility into their own account status.

### 1.3 The Solution

A role-based web application built on React and Supabase. The frontend is a single-page application deployed on Netlify. The backend is entirely Supabase — handling the database, authentication, file storage, and security policies. No separate backend server is required.

### 1.4 Who Uses the System

There are three types of users, each with a different level of access:

**Admin (Directors):** Full access to everything. Registers members, records payments, manages claims from submission through to payment, generates all reports, and manages user accounts.

**Executive:** Records payments, submits claims, reviews claim documents, views reports, and views member information. Cannot approve or reject claims and cannot change member status.

**Member:** Views their own profile, their own payment history, their own beneficiary list, and their own claim status. Cannot see any other member's information.

### 1.5 Project Scope

**In scope for this submission:**
- Public landing page with organisation information and login entry point
- Role-selection login flow (Admin, Executive, Member)
- Member registration and management
- Monthly payment recording and receipt generation
- Beneficiary management (up to 10 per member)
- Death claim workflow from submission to payment
- PDF report generation for executives and directors
- Role-based access for all three user types
- Email notifications for key events
- Audit trail for all data changes
- POPIA-compliant consent capture
- Three seed accounts (one per role) for demonstration

**Out of scope:**
- Online payment collection
- Native mobile application
- SMS notifications
- Multi-organisation support
- WhatsApp integration
- Payroll or accounting integration

---

## 2. Goals and Success Definition

### 2.1 What the System Must Do

Every operation that currently happens on paper must have a digital equivalent. No feature from the paper system may be left out of the digital system.

### 2.2 Functional Success

The system is functionally successful when:

- An admin can register a new member in under two minutes
- A payment can be recorded and a receipt generated in under thirty seconds
- A claim can move from submission through approval to paid status entirely within the system, with documents attached at each stage
- An executive can produce a monthly payment summary with one click
- A member can log in on their phone and see their own payment history and beneficiary list without any assistance

### 2.3 Technical Success

The system is technically successful when:

- No unhandled errors are visible to any user — every failure shows a readable message
- A member user cannot access another member's data under any circumstance, even by manipulating the URL or making direct API calls
- All form inputs are validated before reaching the database
- The application works correctly on desktop Chrome, mobile Chrome, and mobile Safari
- The application loads the dashboard in under three seconds on a standard connection

### 2.4 Academic Success

The submission is academically successful when:

- All five modules (Members, Payments, Beneficiaries, Claims, Reports) are working end to end
- Role-based access is demonstrably enforced — showing a different experience for each role
- The codebase is organised and readable with a clear separation of concerns
- The system matches the requirements stated in the WIL brief

---

## 3. Technology Stack

### 3.1 Frontend

**React with Vite** is the build tool and frontend framework. Vite is chosen over Create React App because it starts faster, builds faster, and is the current industry standard for new React projects.

**Tailwind CSS** handles all styling. It is a utility-first CSS framework — styles are applied directly in the JSX rather than in separate CSS files. This is faster to build with and avoids naming conflicts.

**React Router v6** manages navigation between pages. It supports protected routes, which redirect unauthenticated users to the login page automatically.

**Zustand** manages global state. It is simpler than Redux and appropriate for a project of this size. It stores the current user session and role so every component can access it without prop drilling.

**React Hook Form with Zod** handles form validation. React Hook Form manages the form state and submission, and Zod defines the validation rules as a schema. This combination is the industry standard for React forms.

**React Hot Toast** displays success and error notifications. These replace the TempData flash messages from the .NET version.

**jsPDF with AutoTable** generates downloadable PDF reports entirely in the browser.

### 3.2 Backend (Supabase)

**Supabase Auth** handles all authentication. It issues JWT tokens that contain the user's role as a custom claim. The frontend reads this claim to know what to show, and the database reads it to enforce Row Level Security.

**Supabase PostgreSQL** is the database. It is a fully managed PostgreSQL instance. All tables, relationships, and constraints are defined in SQL migration files.

**Row Level Security (RLS)** is PostgreSQL's built-in access control system. It replaces the controller-level authorisation from the .NET version. Every table has RLS policies that determine what each role can read, insert, update, or delete. A Member user querying the members table will only ever receive their own record — the database enforces this, not the frontend.

**Supabase Storage** holds claim documents such as death certificates and ID copies. Each uploaded file is stored in a bucket with its own access policies.

**Supabase Edge Functions** run server-side logic that should not happen in the browser. This includes sending email notifications and generating audit log entries for sensitive operations.

### 3.3 Hosting and DevOps

**Netlify** hosts the frontend. It connects to the GitHub repository and automatically deploys on every push to the main branch. A `_redirects` file in the public folder ensures React Router works correctly after deployment.

**GitHub** is the version control system. One commit per completed phase minimum.

**Supabase Cloud** hosts the database, auth, storage, and edge functions. The free tier is sufficient for this project.

### 3.4 Key Package List for Gemini

When asking Gemini to generate code, provide this list so it installs the correct packages:

- vite
- react, react-dom
- react-router-dom (v6)
- @supabase/supabase-js
- tailwindcss, postcss, autoprefixer
- zustand
- react-hook-form
- @hookform/resolvers
- zod
- react-hot-toast
- jspdf
- jspdf-autotable
- lucide-react (icons)
- date-fns (date formatting)

---

## 4. System Architecture

### 4.1 How the Three Layers Connect

The browser loads the React application from Netlify. The React application communicates with Supabase directly using the Supabase JavaScript client. There is no custom API server in between — Supabase acts as both the API and the database.

When a user logs in, Supabase Auth returns a JWT token. This token is stored in the browser and sent automatically with every subsequent database request. Supabase reads the role claim inside the token and applies the appropriate RLS policies before returning any data.

### 4.2 Folder Structure

The project follows a feature-based folder structure. Each major feature has its own folder containing its pages, components, and service functions. Shared utilities sit at the top level of the source folder.

The structure Gemini should generate:

```
project-root/
├── public/
│   ├── _redirects              (Netlify SPA routing fix)
│   └── logo.png                (the PMF logo)
├── src/
│   ├── components/             (shared UI components)
│   │   ├── layout/             (Navbar, LandingNavbar, PageWrapper)
│   │   ├── ui/                 (Button, Input, Badge, Modal, Table)
│   │   └── forms/              (FormField, SelectField, TextAreaField)
│   ├── pages/
│   │   ├── landing/            (LandingPage)
│   │   ├── auth/               (LoginPage — manages role selection + form in one component)
│   │   ├── dashboard/          (AdminDashboard, ExecutiveDashboard, MemberDashboard)
│   │   ├── members/            (MemberListPage, MemberRegisterPage, MemberEditPage, MemberDetailsPage)
│   │   ├── payments/           (PaymentRecordPage, PaymentHistoryPage, OverdueMembersPage)
│   │   ├── beneficiaries/      (BeneficiaryListPage, BeneficiaryAddPage)
│   │   ├── claims/             (ClaimListPage, ClaimSubmitPage, ClaimDetailsPage)
│   │   └── reports/            (ReportsPage)
│   ├── services/               (one file per module — no direct Supabase calls in components)
│   │   ├── memberService.js
│   │   ├── paymentService.js
│   │   ├── beneficiaryService.js
│   │   ├── claimService.js
│   │   ├── reportService.js
│   │   └── auditService.js
│   ├── hooks/                  (custom React hooks)
│   │   ├── useAuth.js
│   │   ├── useMembers.js
│   │   └── usePayments.js
│   ├── store/                  (Zustand stores)
│   │   └── authStore.js
│   ├── lib/
│   │   └── supabase.js         (single Supabase client instance)
│   ├── routes/
│   │   └── ProtectedRoute.jsx  (redirects unauthenticated to / not /login)
│   ├── utils/
│   │   ├── formatters.js       (currency, date, member number formatting)
│   │   └── validators.js       (Zod schemas)
│   ├── App.jsx                 (router setup)
│   └── main.jsx                (entry point)
├── supabase/
│   └── migrations/             (SQL files run in order)
├── .env.local                  (Supabase URL and anon key — never commit this)
├── .gitignore
└── tailwind.config.js
```

### 4.3 The Service Layer Rule

No component or page is allowed to call Supabase directly. All database communication goes through the service files in the `services/` folder. This mirrors the Service Layer pattern from the .NET version and means that if the database structure changes, you only update the service file — not every component that uses that data.

For example: a component that needs a list of members calls `memberService.getMembers()`. It does not import the Supabase client and write a query itself.

### 4.4 The Supabase Client

There is exactly one Supabase client instance in the entire application, created in `lib/supabase.js`. Every service file imports from this single file. The URL and anon key come from environment variables, never hard-coded.

---

## 5. Database Schema and Design

### 5.1 Tables Overview

The database has seven tables. Six hold application data and one is the audit trail.

**profiles** — extends Supabase Auth users. The `auth.users` table managed by Supabase holds credentials. The `profiles` table (in the public schema) holds additional information: full name, role, and a link to a member record if the user is a Member-role user. This table is created with a database trigger that fires automatically when a new auth user is created.

**members** — the core table. Holds all member registration information. Has a unique constraint on the ID number column and a unique constraint on the member number column.

**payments** — each row is one payment for one member and one covered month. Duplicate member/month rows are allowed only when staff provide a note explaining why an additional payment is being recorded. Links back to the members table.

**beneficiaries** — each row is one beneficiary linked to one member. The service layer enforces the maximum of 10 active beneficiaries per member before inserting.

**claims** — each row is one death claim. Has a status column that follows a strict workflow. Links to both the members table and optionally the beneficiaries table (when the deceased is a beneficiary rather than the member themselves).

**claim_documents** — each row is one uploaded file attached to a claim. Stores the original filename, the storage path in Supabase Storage, and the document type.

**audit_logs** — append-only. Every meaningful data change in the system writes a row here. Never updated or deleted. Stores the table name, operation type, affected record ID, acting user ID, acting user name, timestamp, and a human-readable description.

### 5.2 Column Definitions

**profiles table:**
- id (UUID, primary key, references auth.users)
- full_name (text, not null)
- role (text, not null, one of: admin, executive, member)
- member_id (integer, nullable, references members — only set for member-role users)
- must_change_password (boolean, default false)
- created_at (timestamp with timezone)

**members table:**
- id (integer, primary key, auto-increment)
- member_number (text, not null, unique) — format PM-YYYY-NNN
- full_name (text, not null)
- id_number (text, not null, unique) — must be exactly 13 digits
- phone (text, not null)
- email (text, nullable)
- physical_address (text, not null)
- status (text, not null, default 'active') — one of: active, suspended, deceased, resigned, inactive
- joined_date (date, not null)
- consent_given (boolean, not null, default false)
- consent_date (timestamp with timezone, nullable)
- created_at (timestamp with timezone, default now())
- created_by (UUID, references auth.users)

**payments table:**
- id (integer, primary key, auto-increment)
- member_id (integer, not null, references members)
- amount (numeric 10,2, not null)
- month_year (text, not null) — format YYYY-MM e.g. 2025-05
- paid_at (timestamp with timezone, default now())
- receipt_number (text, not null, unique) — format RCP-YYYYMMDD-NNN
- recorded_by (UUID, references auth.users)
- notes (text, nullable)

**beneficiaries table:**
- id (integer, primary key, auto-increment)
- member_id (integer, not null, references members)
- full_name (text, not null)
- id_number (text, not null)
- relationship (text, not null) — one of: Spouse, Child, Parent, Sibling, Other
- phone (text, nullable)
- date_of_birth (date, not null)
- is_active (boolean, not null, default true)
- created_at (timestamp with timezone, default now())

**claims table:**
- id (integer, primary key, auto-increment)
- member_id (integer, not null, references members)
- beneficiary_id (integer, nullable, references beneficiaries)
- status (text, not null, default 'submitted') — one of: submitted, under_review, approved, rejected, paid
- submitted_at (timestamp with timezone, default now())
- submitted_by (UUID, references auth.users)
- reviewed_by (UUID, nullable, references auth.users)
- reviewed_at (timestamp with timezone, nullable)
- approved_by (UUID, nullable, references auth.users)
- approved_at (timestamp with timezone, nullable)
- amount_approved (numeric 10,2, nullable)
- paid_at (timestamp with timezone, nullable)
- rejection_reason (text, nullable)
- notes (text, nullable)

**claim_documents table:**
- id (integer, primary key, auto-increment)
- claim_id (integer, not null, references claims)
- file_name (text, not null) — original file name shown to users
- stored_path (text, not null) — path within Supabase Storage bucket
- document_type (text, not null) — one of: death_certificate, member_id, beneficiary_id, funeral_quotation, other
- uploaded_at (timestamp with timezone, default now())
- uploaded_by (UUID, references auth.users)

**audit_logs table:**
- id (integer, primary key, auto-increment)
- table_name (text, not null)
- operation (text, not null) — one of: CREATE, UPDATE, DELETE, STATUS_CHANGE
- record_id (text, nullable)
- user_id (UUID, not null)
- user_name (text, not null)
- changed_at (timestamp with timezone, default now())
- description (text, not null)
- previous_value (text, nullable)
- new_value (text, nullable)

### 5.3 The Member Number Format

Member numbers follow the format PM-YYYY-NNN where YYYY is the year of registration and NNN is a zero-padded 3-digit sequence that resets to 001 at the start of each year. The sequence is calculated by querying the highest existing sequence number for the current year and incrementing it by one.

Examples: PM-2025-001, PM-2025-047, PM-2026-001.

### 5.4 The Receipt Number Format

Receipt numbers follow the format RCP-YYYYMMDD-NNN where YYYYMMDD is the date the payment was recorded and NNN is a zero-padded 3-digit sequence for that day.

Examples: RCP-20250501-001, RCP-20250501-023.

### 5.5 The Profile Trigger

When a new user is created in Supabase Auth, a PostgreSQL trigger fires automatically and creates a corresponding row in the profiles table. This means every auth user always has a profile. The trigger should set the role to 'member' by default. Admins then update the role in the profiles table when creating Executive or Admin accounts.

---

## 6. Row Level Security Strategy

### 6.1 What RLS Does

Row Level Security is a PostgreSQL feature that attaches access rules directly to database tables. When an authenticated user makes a query, PostgreSQL checks the RLS policies before returning any rows. A policy that fails means the row is invisible to that user — it is as if it does not exist.

This is the primary security mechanism. The frontend hiding certain buttons is a user experience decision, not a security decision. Security comes from RLS.

### 6.2 How Role is Passed to the Database

When a user logs in via Supabase Auth, they receive a JWT token. The role stored in the profiles table must be added to this JWT as a custom claim so the database can read it from within an RLS policy. This is done using a PostgreSQL function and a Supabase Auth hook.

The function reads the user's role from the profiles table and returns it. The hook tells Supabase Auth to include this function's return value in every JWT it generates. The RLS policies then use `auth.jwt() ->> 'role'` to check the current user's role.

### 6.3 Policy Summary Per Table

**profiles table:**
- Any authenticated user can read their own profile row
- Admin can read all profile rows
- Users can update only their own profile row
- Only Admin can insert new profiles (account creation)

**members table:**
- Admin and Executive can read all member rows
- Member-role users can read only the row where the member_id matches their own linked member ID
- Admin and Executive can insert new member rows
- Admin and Executive can update member rows
- No role can delete member rows (soft delete via status change only)

**payments table:**
- Admin and Executive can read all payment rows
- Member-role users can read only payments where member_id matches their own
- Admin and Executive can insert payment rows
- Admin and Executive can update payment rows
- No role can delete payment rows

**beneficiaries table:**
- Admin and Executive can read all beneficiary rows
- Member-role users can read only beneficiaries where member_id matches their own
- Admin and Executive can insert and update beneficiary rows
- No role can delete beneficiary rows (soft delete via is_active = false)

**claims table:**
- Admin and Executive can read all claim rows
- Member-role users can read only claims where member_id matches their own
- Admin and Executive can insert claim rows
- Only Admin can update claim status to approved or rejected
- No role can delete claim rows

**claim_documents table:**
- Admin and Executive can read and insert document rows
- Member-role users can read documents on their own claims only

**audit_logs table:**
- Admin can read all audit log rows
- No role can insert, update, or delete audit log rows through the client — writes happen via a service function or edge function with elevated permissions

---

## 7. Feature Specifications

### 7.1 Landing Page

The landing page lives at the root path `/` and is fully public — no authentication is required to view it. It is the first thing any visitor sees and the page all users are sent to after logging out.

**Purpose:** Introduce the organisation, establish trust, and provide the single entry point into the system.

**Sections on the landing page, in order from top to bottom:**

The hero section fills the top of the page. It displays the Pfukani Magaza Forum logo prominently, the organisation name, and a short tagline describing what the burial society does. It contains one primary call-to-action button labelled "Member Login" and one secondary button labelled "Staff Login". Both buttons open the login flow described in section 7.2. The hero background uses the brand green (#2A8C34) with white text.

The about section sits below the hero. It contains a brief paragraph describing the organisation — its purpose, how long it has been operating, and how many members it serves. This text can be static copy. The background is white.

The services section shows three cards in a row describing what the burial society provides: financial support, logistical assistance, and member benefits. Each card has an icon, a heading, and two lines of description. The background is light grey (#F5F5F5).

The contact section at the bottom shows the organisation's location (Limpopo, South Africa), a placeholder phone number, and a placeholder email address. The background is the brand charcoal (#3C3C3C) with white text.

The footer below the contact section shows the organisation name, the current year, and the text "Powered by BSMS". Background is near-black.

**Navigation bar on the landing page:**
The landing page has its own minimal navbar — just the organisation logo/name on the left and a "Login" button on the right. This navbar does not show the full application navigation that authenticated users see. It is a separate component from the authenticated Navbar.

### 7.2 Authentication and Login Flow

**Entry points:** Both the "Member Login" button, the "Staff Login" button on the hero, and the "Login" button on the landing navbar all open the same login flow. The distinction between Member and Staff buttons is cosmetic — they lead to the same place.

**Step 1 — Role Selection Screen:**
Before showing the email and password form, the user sees a "Log in as" screen. This screen has three large role cards arranged in a row:

- Admin card: shows an admin/shield icon, the label "Admin", and the description "Directors — Full system access"
- Executive card: shows a briefcase icon, the label "Executive", and the description "Staff — Payments, claims and reports"
- Member card: shows a person icon, the label "Member", and the description "View your account and payments"

Each card is clickable. Clicking one does not change what happens during login — it is a UX guide to help users self-identify. After clicking a card the user proceeds to Step 2.

The role selection screen has a back link to return to the landing page.

**Step 2 — Email and Password Form:**
A standard email and password form. The selected role from Step 1 is shown as a small badge above the form (e.g. "Logging in as Admin") so the user can confirm they chose correctly. There is a "Wrong role?" link that takes them back to Step 1.

After a successful login, Supabase returns the JWT. The auth store reads the `user_role` claim from the JWT. The app then redirects to the correct dashboard based on the actual role in the database — not the role the user selected in Step 1. If someone selects "Member" but their account is actually an Executive, they are sent to the Executive dashboard. The role selection is purely UX guidance.

After a failed login the message shown is "Invalid email or password" without specifying which was wrong. The form stays on Step 2 so the user can try again.

**Logout behaviour:**
When any user clicks logout, the auth store clears the session and Supabase Auth removes the token from localStorage. The user is redirected to the landing page at `/` — not to the login page. They land back on the public-facing page and can choose to log in again from there.

**Session handling:**
Sessions are managed automatically by Supabase Auth. The client persists the session in localStorage and refreshes the token before it expires. If a session expires mid-use, the next failed Supabase call redirects the user to the landing page.

**Account creation:**
There is no self-registration. All accounts are created by an Admin from within the system. The password for new accounts is set by the Admin. The new user must change their password on first login, enforced by checking the `must_change_password` flag in their profile.

### 7.3 Seed Accounts

Three accounts exist from the start so the system can be demonstrated immediately without manual setup. These are created during the Supabase setup phase.

| Role | Full Name | Email | Password |
|---|---|---|---|
| Admin | System Administrator | admin@pfukani.org | Admin@12345 |
| Executive | Executive User | executive@pfukani.org | Exec@12345 |
| Member | Test Member | member@pfukani.org | Member@12345 |

The Member seed account must have a corresponding row in the members table and the profile's `member_id` must be linked to it. Without this link the member dashboard cannot load the member's own data. The seed member record should have realistic data: a valid member number (PM-2025-001), a full name matching the profile, an active status, a joined date, and consent given.

The Executive seed account only needs a profile with `role = 'executive'`. No member record is needed.

The Admin seed account only needs a profile with `role = 'admin'`. No member record is needed.

### 7.4 Member Management

**Who can access what:**
- Admins: register, view, edit, change status, export data
- Executives: view list, view details, edit contact information
- Members: view their own profile only

**Member Registration (Admin only):**

The registration form collects full name, SA ID number, phone number, email (optional), physical address, date joined, and a POPIA consent checkbox.

The consent checkbox must be explicitly checked. Pre-ticking it is not valid and the schema should reflect this. The label must clearly state that the member's personal information will be collected and processed in accordance with POPIA.

Before saving, the service must check that the ID number is not already registered. If it is, the form returns an error without saving.

On successful registration the member number is generated, the record is saved, an audit log entry is created, and the user is redirected to the new member's details page with a success notification.

**Member List (Admin + Executive):**

A paginated table showing 25 members per page. Columns: Member Number, Full Name, Phone, Status, Date Joined, Beneficiary Count. A search input filters by name, member number, or ID number. A dropdown filters by status.

When the list is empty the page shows a friendly empty state message. If the user is an Admin, the empty state includes a Register Member button.

**Member Details (Admin + Executive + Member viewing own):**

Shows all personal information. Shows a payment summary: total payments made, total amount paid, whether the current month has been paid. Shows beneficiary count out of 10. Shows active claims count. Shows the 10 most recent audit log entries for that member.

**Edit Member (Admin + Executive):**

All fields are editable except the ID number, which is displayed as read-only text. The member number is also displayed but not editable.

**Change Member Status (Admin only):**

A separate page reached from the Details page. Shows the current status and a dropdown for the new status. Requires a written reason. The reason is saved in the audit log entry.

### 7.5 Payment Management

**Who can access what:**
- Admin and Executive: record payments, view all payment history, view overdue list
- Member: view their own payment history only

**Record Payment (Admin + Executive):**

The form has a member search field (searches by name or member number as the user types, showing a dropdown of results), an amount field pre-filled with 200, a month/year picker defaulting to the current month, and an optional notes field.

Before saving, the service checks if a payment already exists for that member and month. If it does, a warning is shown with the option to override it by providing a note. The override is not an update to the existing payment — it is a second payment record with a note explaining it is a correction.

The service generates a receipt number, saves the payment, writes an audit log entry, and if the member has an email address, queues an email notification.

**Payment History (per member):**

A table showing all payments for a member: Month/Year, Amount, Receipt Number, Paid At, Recorded By. Below the table a summary row shows total paid and whether the member is currently paid up or in arrears.

**Overdue Members List (Admin + Executive):**

All Active-status members who do not have a payment recorded for the current month. Shows member number, name, phone number, and how many consecutive months are outstanding.

**Receipt:**

After recording a payment, there is a button to download a PDF receipt. The receipt contains the organisation name, receipt number, member name and member number, amount, month covered, date of payment, and the name of the staff member who recorded it.

### 7.6 Beneficiary Management

**Who can access what:**
- Admin and Executive: add, edit, deactivate beneficiaries for any member
- Member: view their own beneficiaries only

**Add Beneficiary (Admin + Executive):**

The form collects full name, SA ID number, date of birth, relationship to member (from a fixed dropdown: Spouse, Child, Parent, Sibling, Other), and an optional phone number.

Before saving, the service counts active beneficiaries for the member. If the count is already 10, the service returns an error and the record is not saved. The error message shown is that the member has reached the maximum of 10 beneficiaries.

**Deactivate Beneficiary (Admin only):**

Soft-deletes by setting is_active to false. The record is kept in the database for historical claim purposes. A reason must be provided and is saved in the audit log.

### 7.7 Claims Processing

The claims workflow is the most sensitive module. Every state change must be logged. The workflow only moves forward — there is no going backward through states.

**Valid State Transitions:**

Submitted can move to Under Review or directly to Rejected.
Under Review can move to Approved or Rejected.
Approved can move to Paid or Rejected.
Rejected is a terminal state — no further transitions.
Paid is a terminal state — no further transitions.

Any attempt to make an invalid transition must be blocked by the service layer and return an error. The UI must only show buttons for valid transitions for the current state.

**Who can trigger each transition:**

Submitted to Under Review: Admin or Executive
Under Review to Approved: Admin only
Under Review to Rejected: Admin only
Approved to Paid: Admin only
Approved to Rejected: Admin only

**Submit Claim (Admin + Executive):**

The form has a member search field. After selecting a member, the form asks whether the claim is for the member themselves or for a beneficiary. If a beneficiary, a dropdown of that member's active beneficiaries appears.

The form also captures the date of death and optional notes.

After the initial form is submitted and saved with Submitted status, the next screen allows documents to be uploaded.

On submission, the member's status is automatically changed to Deceased and an audit log entry is created for both the claim creation and the member status change.

**Document Upload:**

Accepted file types are PDF, JPG, and PNG only. Maximum file size is 5MB per file. Files are uploaded to Supabase Storage. The stored path uses a structure of claims/[claim-id]/[UUID][extension]. The original filename is saved in the claim_documents table for display purposes.

Validation must check both the file extension and the MIME type. A file renamed from .exe to .pdf must be rejected.

Required documents before a claim can move from Submitted to Under Review: Death Certificate and Member ID Copy.

**Review, Approve, Reject, Mark as Paid:**

Each of these is a distinct action with its own confirmation step. Approve requires an amount. Reject requires a written reason. All transitions write an audit log entry and send an email notification to the relevant parties.

**Claims List:**

Filterable by status. Shows claim ID, member name, submission date, current status, and approved amount if applicable. Clicking a row opens the claim details page.

**Claim Details:**

Shows all claim information, document list with download links, the full status history from the audit log, and action buttons for valid next transitions based on the current user's role.

### 7.8 Reports

**Who can access:** Admin and Executive only.

All reports can be viewed in the browser and downloaded as PDF.

**Monthly Payment Report:**

Input: month and year selection.
Output: total members, number who paid, number who did not pay, collection rate as a percentage, total amount collected, a table of members who paid with receipt numbers, a table of members who did not pay with phone numbers for follow-up.

**Member Status Report:**

No input needed.
Output: count of members by each status, new members registered in the current month, a full member list with status.

**Claims Summary Report:**

Input: date range (from and to).
Output: total claims in period, breakdown by status, total amount approved and paid out, a table of all claims in the period.

**Audit Log Report (Admin only):**

Input: date range, optional user filter.
Output: a table of all audit log entries in the period.

### 7.9 Dashboards

**Admin Dashboard:**

Four summary cards: Total Active Members, Payments This Month (count and amount), Active Claims (not yet paid or rejected), Overdue Members (active members without a payment this month).

A quick actions section with buttons to Register Member, Record Payment, Submit Claim, and Generate Report.

A recent activity feed showing the last 10 audit log entries across the whole system.

**Executive Dashboard:**

Three summary cards: Total Active Members, Payments This Month, Claims Pending Review.

A table of the top 10 members with the most months outstanding.

**Member Dashboard:**

A card showing whether the current month's payment is recorded. The member's beneficiary count. Any active claims with their current status. The last 5 payment records.

---

## 8. Component Architecture

### 8.1 Shared Components

These components are used across multiple pages and must be built before any feature pages.

**Layout components:**
The Navbar sits at the top of every authenticated page. It shows the system name on the left and the current user's name with a logout button on the right. The navigation links shown depend on the user's role. On mobile the links collapse into a hamburger menu.

The PageWrapper component wraps every page with consistent padding, a page title section, and the flash notification area.

**UI components:**
A Button component that accepts a variant (primary, secondary, danger, outline) and handles loading state by showing a spinner when an async operation is running.

A DataTable component that renders a responsive table with sortable column headers, a search input, and pagination. It accepts columns and data as props. This component is used on the Members list, Payments list, and Claims list.

A StatusBadge component that takes a status string and returns a coloured badge. Member statuses and claim statuses each have their own colour mapping.

A Modal component for confirmation dialogs before destructive or irreversible actions.

A StatCard component for the dashboard summary cards.

A FileUpload component that handles drag-and-drop and click-to-browse, validates file type and size before uploading, shows a progress indicator, and calls a callback with the result.

### 8.2 Form Components

A FormField component wraps a label, input, and validation error message into one reusable unit. It integrates with React Hook Form via the register prop pattern.

A SelectField component for dropdowns. A TextAreaField for multi-line inputs.

All form components display validation errors below the input field using Zod error messages passed from the form's error object.

---

## 9. Routing and Navigation

### 9.1 Route Structure

The application has three route groups.

**Public routes** require no authentication. Anyone can access these:
- `/` — the landing page
- `/login` — the role selection and login form

**Protected routes** require authentication. Unauthenticated users attempting to access these are redirected to `/` (the landing page, not `/login`). The ProtectedRoute component handles this redirect.

Some protected routes are further restricted by role. The ProtectedRoute component accepts an `allowedRoles` prop. If the authenticated user's role is not in the allowed list, they are redirected to an Access Denied page.

### 9.2 Route to Page Mapping

The landing page lives at `/`.

The login flow lives at `/login`. It manages its own internal state between the role selection step (Step 1) and the email/password form (Step 2) using local React state — no separate routes are needed for each step.

The dashboard lives at `/dashboard`. The component rendered depends on the user's role read from the auth store — AdminDashboard, ExecutiveDashboard, or MemberDashboard.

Member routes: `/members` for the list, `/members/register` for registration, `/members/:id` for details, `/members/:id/edit` for editing, `/members/:id/status` for status change.

Payment routes: `/payments/record` for recording, `/payments/history/:memberId` for a specific member's history, `/payments/overdue` for the overdue list.

Beneficiary routes: `/members/:id/beneficiaries` for the list, `/members/:id/beneficiaries/add` for adding.

Claims routes: `/claims` for the list, `/claims/submit` for submission, `/claims/:id` for details.

Reports route: `/reports` with sub-routes for each report type.

### 9.3 Navigation After Actions

After any successful form submission the user is redirected. After registering a member, redirect to that member's details page. After recording a payment, redirect to the payment history for that member. After submitting a claim, redirect to that claim's details page. After any edit, redirect to the details page for the edited record.

After any failed action the user stays on the same page. The error is shown in a notification toast and if relevant as inline field errors.

**After logout:** always redirect to `/` — the landing page. Never redirect to `/login` on logout.

---

## 10. State Management

### 10.1 What Goes in Zustand

The auth store holds: the current user object (from Supabase Auth), the current user's profile (from the profiles table, including role), a loading boolean for the initial auth check, and an initialised boolean.

Nothing else belongs in Zustand. All other data (member lists, payment records, etc.) is fetched per page using React hooks and local component state. Putting fetched lists in global state causes stale data problems.

### 10.2 Auth Store Behaviour

On application load, before any page renders, the auth store calls Supabase to check for an existing session. While this check is in progress, the app shows a full-screen loading spinner. Once complete, if a session exists the user is routed to their dashboard. If not, they see the landing page.

When a user logs out, the auth store clears the user and profile, Supabase Auth removes the session from localStorage, and the app navigates to `/` — the landing page. The logout function in the auth store must explicitly navigate to `/` after clearing the session, never to `/login`.

### 10.3 Page-Level Data Fetching

Each page fetches its own data when it mounts. The pattern for every data page is: show a loading skeleton while the data loads, show the data once it arrives, show an error message if the fetch fails. Never show an empty state that could be confused with a loading state.

---

## 11. Security and POPIA Compliance

### 11.1 Authentication Security

Supabase Auth handles password hashing using bcrypt. Plain text passwords are never stored or logged.

The session token is stored in localStorage by the Supabase client. This is acceptable for this project's threat model but Gemini should be aware it exists.

The login form does not reveal whether the email or password was incorrect — it always says "Invalid email or password."

### 11.2 Authorisation Security

The ProtectedRoute component provides a user experience layer — it stops the average user from accidentally reaching a page they should not see. It is not the security mechanism.

The actual security is RLS. Because every Supabase query is made with the user's JWT, the database applies policies before returning data. A Member user who somehow navigates to /members and calls the members query will receive only their own record. The database enforces this regardless of what the frontend does.

The service layer must never expose admin-only operations to non-admin callers. The service functions must include a role check before performing any operation that is restricted by role, in addition to relying on RLS.

### 11.3 Input Validation

Every form uses a Zod schema for validation. The schema is validated by React Hook Form before the data reaches any service function. The service function performs its own validation before calling Supabase. Never trust the form data to be clean by the time it reaches the service.

The SA ID number field must be validated with a regex that requires exactly 13 digits. The format validation for member numbers and receipt numbers must be enforced in the generator functions.

### 11.4 File Upload Security

Files are uploaded to Supabase Storage. Before uploading, the client must check the MIME type (not just the extension) and the file size. The Supabase Storage bucket must have its own access policies so that only authenticated users with the correct role can write to it and only relevant users can read from it.

Uploaded files are renamed to a UUID before storage so that the original filename cannot be used for path traversal or overwrite attacks. The original filename is stored in the database for display.

### 11.5 Environment Variables

The Supabase URL and anon key live in a .env.local file which is listed in .gitignore and never committed to the repository. The production values are set in Netlify's environment variable settings. Gemini must never hard-code these values.

### 11.6 POPIA Compliance

Every member registration must include a consent checkbox. The checkbox must not be pre-ticked. The label must clearly state the purpose of data collection and reference POPIA. The timestamp of consent is saved alongside the member record.

An admin must be able to export all data related to a specific member as a JSON or PDF file to comply with access requests.

A data retention policy must be documented: records are kept for 7 years after a member's resignation or death.

---

## 12. Error Handling Strategy

### 12.1 The Three Types of Errors

**Validation errors** happen before any network call. They are shown inline below the relevant form field using the Zod schema's error messages. The form does not submit if validation fails.

**Service errors** happen during a Supabase call. Examples are duplicate ID number, payment already recorded for that month, or a beneficiary at the maximum count. These are returned as error objects from the service function and shown as toast notifications and/or form-level error messages.

**Unexpected errors** are anything not anticipated. These are caught by a global error boundary or a try-catch in the service function. The user sees a generic "Something went wrong" toast. The full error is logged to the console and should be sent to an error tracking service in production.

### 12.2 Service Function Return Pattern

Every service function returns a consistent shape: an object with a data property and an error property. On success, data contains the result and error is null. On failure, data is null and error contains a message string. The calling component checks which one is present and responds accordingly.

### 12.3 Loading States

Every async operation must have a visible loading state. Buttons show a spinner and become disabled while their operation is running. Tables show skeleton rows while data loads. Never leave the user looking at a blank space without feedback.

### 12.4 Empty States

Every list page must have a designed empty state — not just an empty table. The empty state shows a relevant icon, a message explaining why the list is empty, and where appropriate a call to action (such as a Register Member button on the empty members list).

### 12.5 Not Found

If a user navigates to a URL for a record that does not exist (for example, /members/9999 when member 9999 does not exist), the page must show a clear Not Found message with a link back to the list. It must never show a blank page or crash.

---

## 13. UI and UX Standards

### 13.1 Colour Palette

The colour palette is derived directly from the official Pfukani Magaza Forum logo. The logo contains four colours that form the complete brand system. Every colour decision in the application must reference one of these four values.

**Brand Colours:**

Primary Green — hex #2A8C34
This is the dominant brand colour, taken from the diagonal border stripes and the outlined letterforms in the logo. It is used for the navbar background, primary action buttons, active status badges, approved claim badges, success states, and the login page header. When the user sees green, it means Pfukani and it means action.

Primary Yellow / Gold — hex #F5C518
This is the accent colour, taken from the filled letterforms and alternating border stripes. It is used for warning states, suspended member badges, under-review claim badges, hover highlights on secondary elements, and decorative accents such as the login page logo area border. It is never used as a background for large areas because it reduces text contrast at body font sizes.

Dark Charcoal — hex #3C3C3C
This is the text and illustration colour, taken from the kudu skull, pottery illustrations, and the "PFUKANI MAGAZA FORUM" wordmark. It is used for all body text, table cell content, form labels, card headings, and icon strokes. It replaces pure black (#000000) everywhere in the application to keep the visual tone warm rather than harsh.

White — hex #FFFFFF
The logo background colour. Used as the card background, form input background, modal background, and page background on content-heavy admin pages.

**Supporting Neutral:**

Light Grey — hex #F5F5F5
Not from the logo but required for the application background so that white cards lift off the page. This is the only colour in the system that is not directly derived from the logo.

**Tailwind Custom Colour Configuration:**

When instructing Gemini to configure Tailwind, provide these exact names and hex values so that utility classes like bg-brand-green, text-brand-yellow, and border-brand-charcoal are available throughout the project:

- brand-green: #2A8C34
- brand-yellow: #F5C518
- brand-charcoal: #3C3C3C
- brand-white: #FFFFFF
- brand-grey: #F5F5F5

**Colour Application Rules:**

Navbar: green background (#2A8C34) with white text and icons.

Login page: white card centred on a green background. The card header uses the green with the logo displayed above the form. This immediately establishes the brand on the first screen every user sees.

Primary buttons (Register Member, Save, Confirm): green background with white text.

Secondary buttons (Cancel, Back): white background with charcoal border and charcoal text.

Danger buttons (Reject, Deactivate): red background with white text. Red is the one colour used in the application that does not come from the logo — it is a universal danger signal and must be used only for irreversible destructive actions.

Page headings: charcoal text.

Card borders: none — cards use a soft box shadow rather than a border so the white card separates from the grey background without hard lines.

Table header row: very light green tint — use green at 8 percent opacity as the background — with charcoal uppercase text.

**Status Badge Colour Mapping:**

Member statuses:
- Active: green background (#2A8C34) with white text
- Suspended: yellow background (#F5C518) with charcoal text
- Deceased: medium grey (#6B7280) with white text
- Resigned: charcoal background (#3C3C3C) with white text
- Inactive: light grey background with charcoal text

Claim statuses:
- Submitted: blue (#2563EB) with white text — blue is acceptable here as it is an informational neutral state
- Under Review: yellow (#F5C518) with charcoal text
- Approved: green (#2A8C34) with white text
- Rejected: red with white text
- Paid: teal (#0D9488) with white text — teal indicates completion and is visually distinct from the brand green

### 13.2 Typography

The system uses the default Tailwind font stack (system fonts). No custom font loading is needed. Headings use font-bold or font-semibold. Body text uses the default weight. Monospaced font (font-mono) is used for member numbers, ID numbers, and receipt numbers to make them visually distinct and easy to read digit by digit.

### 13.3 Spacing and Layout

Every page has a consistent top margin below the navbar and consistent horizontal padding. Cards have 24px padding. Form fields have 16px gap between them. Action buttons at the bottom of a form have 8px gap between them.

The primary action button is always leftmost. The cancel or secondary action is to its right.

### 13.4 Mobile Responsiveness

The member portal pages (dashboard, payments, beneficiaries, claims) must work on a 375px screen. All tables use horizontal scrolling on small screens. Buttons are minimum 44px tall. Navigation collapses to a hamburger menu on mobile.

The admin and executive views are primarily desktop-targeted but must remain usable on a tablet-sized screen.

### 13.5 Notifications

React Hot Toast displays success notifications in green at the top-right of the screen. Error notifications appear in red. Notifications dismiss automatically after 4 seconds. Destructive actions that cannot be undone require a confirmation modal before proceeding — a toast is not sufficient.

### 13.6 Confirmation Modals

The following actions require a confirmation modal before executing: deactivating a beneficiary, changing member status, rejecting a claim, and deleting any record. The modal must describe exactly what will happen and have a clearly labelled confirm button and a cancel button. The confirm button for destructive actions is styled in red.

---

## 14. Development Phases and Checkpoints

### Phase 1 — Project Foundation

Goal: Running application with landing page, working authentication, and all three seed accounts functional.

What gets built: Vite and React project scaffolding, Tailwind CSS with brand colours, Supabase connection, landing page with all sections (hero, about, services, contact, footer), landing page navbar, the role selection screen, the login form with role badge, auth store with Zustand, ProtectedRoute wrapper, the three role dashboards as shells, and logout redirecting to the landing page.

The three seed accounts must exist in Supabase before this phase can be checked off. The seed SQL is in the Supabase Setup Guide.

Checkpoint — all of these must be true before moving to Phase 2:

The landing page loads at `/` without logging in. The landing page displays the organisation logo, name, and all four sections. The Login button and both hero buttons open the role selection screen. The role selection screen shows three clickable cards — Admin, Executive, Member. Clicking a card shows the email/password form with the selected role badge. The "Wrong role?" link returns to the role selection screen. The back link on the role selection screen returns to the landing page. Entering wrong credentials shows "Invalid email or password." Logging in as `admin@pfukani.org` redirects to the Admin dashboard. Logging in as `executive@pfukani.org` redirects to the Executive dashboard. Logging in as `member@pfukani.org` redirects to the Member dashboard. Each dashboard shows the correct navigation links for its role. Clicking logout from any dashboard redirects to the landing page at `/`, not to `/login`. After logging out, pressing the browser back button does not restore the dashboard. Navigating directly to `/dashboard` while logged out redirects to the landing page. Navigating to `/members` while logged in as the Member role shows the Access Denied page. The profiles table in Supabase contains three rows — one admin, one executive, one member. The members table contains one row for the seed member account.

---

### Phase 2 — Member Management

Goal: Full member CRUD working for all three roles.

What gets built: memberService with all CRUD functions, the Zod schema for member validation, member list page with search and pagination, member register page, member details page, member edit page, member status change page, member profile page for the Member role, and audit log writes for every operation.

Checkpoint — all of these must be true before moving to Phase 3:

Admin can navigate to the members list. The list shows an empty state with a Register Member button. Submitting the registration form with missing required fields shows inline errors. Submitting with a non-13-digit ID number shows the ID validation error. Submitting with unchecked consent shows the consent error. A valid submission creates the member and redirects to the details page with a success toast. The member number is in the format PM-YYYY-NNN. Registering with a duplicate ID number shows an error and does not create a new record. The member appears in the list. The edit form is pre-filled with current data. Saving an edit redirects to details with a success toast. The ID number field is read-only on the edit form. The status change form requires a reason. Changing the status updates the badge on the details page. The audit log in Supabase contains entries for each operation. An Executive can view and edit but cannot see the Change Status option. A Member-role user can only see their own profile page and no other member's data.

---

### Phase 3 — Payments

Goal: Payment recording, history, overdue list, and receipt PDF working.

What gets built: paymentService with all functions, the Zod schema for payment validation, the receipt number generator, the record payment page with member search typeahead, the payment history page per member, the overdue members list page, and the PDF receipt download.

Checkpoint — all of these must be true before moving to Phase 4:

Admin can record a payment. Submitting without selecting a member shows a validation error. Recording a payment for a deceased or resigned member shows an error. Recording a duplicate payment for the same member and month shows a warning. A valid payment saves and generates a receipt number in the correct format. The payment history page shows the correct running total. The overdue list shows members without a payment for the current month. The PDF receipt downloads and contains the correct information. A Member-role user can view their own payment history but not others'. The dashboard total active members count is accurate.

---

### Phase 4 — Beneficiaries

Goal: Beneficiary management linked to members.

What gets built: beneficiaryService with all functions, the Zod schema for beneficiary validation, beneficiary list per member, add beneficiary page, edit beneficiary page, and deactivate confirmation modal.

Checkpoint — all of these must be true before moving to Phase 5:

Admin can add a beneficiary to a member. Adding an 11th beneficiary shows the capacity error. Adding a beneficiary with an ID number already used by another beneficiary on the same member shows an error. Deactivating a beneficiary shows a confirmation modal before proceeding. Deactivated beneficiaries are not shown in the active count. A Member-role user can view their own beneficiaries but cannot add or edit.

---

### Phase 5 — Claims

Goal: Full claims workflow end to end with document upload.

What gets built: claimService with all workflow transition functions, the claim submit page, the claim details page with status history, the claims list page, document upload integration with Supabase Storage, and email notification calls for claim events.

Checkpoint — all of these must be true before moving to Phase 6:

Executive can submit a claim. The member's status changes to Deceased on submission. The claim appears in the list with Submitted status. Admin can change status to Under Review. Attempting to approve a claim without a Death Certificate uploaded shows an error. Admin can approve a claim with an amount. Admin can reject a claim with a reason. An approved claim can be marked as Paid. Attempting an invalid state transition (for example setting a Paid claim to Approved) is blocked. Uploading a file that is not PDF, JPG, or PNG is rejected. Uploading a file over 5MB is rejected. Every state change appears in the audit log. A Member-role user can see their own claim status but cannot perform any actions.

---

### Phase 6 — Reports and Dashboard

Goal: All reports generating correctly and dashboards showing real data.

What gets built: reportService with all report queries, the reports page with each report type, PDF generation for each report, and real data wired into all three dashboard variants.

Checkpoint — all of these must be true before moving to Phase 7:

The monthly payment report shows accurate counts and totals for a selected month. The member status report counts match what is in the database. The claims summary report totals are accurate. PDFs download correctly for each report. The admin dashboard shows accurate figures for all four stat cards. The executive dashboard shows accurate figures. The member dashboard shows whether the current month is paid.

---

### Phase 7 — Polish and Testing

Goal: No rough edges, no unhandled errors, mobile-ready.

What gets built: global error boundary, consistent loading skeletons on all data pages, confirmation modals on all destructive actions, mobile layout fixes across member-facing pages, and a full manual test run against all checkpoint criteria.

Checkpoint — all of these must be true before deployment:

Navigating to a non-existent record shows a Not Found message. Triggering a network error shows a friendly error state, not a crash. All forms show inline errors for every required field. All pages render correctly on a 375px mobile screen. All navigation links work with no broken routes. Logging out clears the session completely — the back button does not restore the dashboard.

---

### Phase 8 — Deployment

Goal: Running on production Netlify and Supabase.

Steps: Create a production Supabase project, run all migrations against it, set up RLS policies, seed the admin account, push the frontend to GitHub, connect the GitHub repo to Netlify, add the Supabase production URL and anon key as Netlify environment variables, add the _redirects file to the public folder, trigger a deployment, test the live URL end to end.

Checkpoint:

The live Netlify URL loads the login page. Login works with the production admin account. A test member, payment, and claim can be created and the full workflow completes. HTTPS is active on the Netlify domain. The default admin password has been changed.

---

## 15. What to Avoid

### Architecture mistakes

Do not call Supabase directly from a component or page. All database communication goes through service functions. Breaking this rule makes the codebase impossible to maintain when the database structure changes.

Do not store fetched list data in Zustand. Fetched data belongs in local component state or a custom hook. Global state is only for things that must survive page navigation — the user session.

Do not use the Supabase service role key on the frontend. The service role key bypasses all RLS policies. It must never appear in frontend code. If it is committed to GitHub, the entire database is exposed.

Do not use the auth.users table directly in RLS policies when you mean to use the profiles table. The auth schema is managed by Supabase. Custom user data lives in the profiles table in the public schema.

### Security mistakes

Do not rely on hiding UI elements for security. A member user who opens browser dev tools can call the Supabase API directly. RLS is the only thing that actually prevents them from seeing other members' data.

Do not put Supabase credentials in any file that is committed to GitHub. Use .env.local for development. Use Netlify environment variables for production.

Do not skip the MIME type check on file uploads. Checking only the extension is not enough.

### Common React mistakes

Do not fetch data inside a useEffect without a cleanup or dependency array. Missing dependency arrays cause infinite re-renders. Gemini should use the correct dependency array on every useEffect.

Do not mutate state directly. Always use the state setter function.

Do not forget the key prop on list items rendered with map. Missing keys cause React reconciliation warnings and bugs.

Do not redirect after a failed form submission. Stay on the form page and show the error.

### Scope creep to push back on

Any of the following are out of scope for this submission and should not be added: real-time subscriptions with Supabase Realtime, WhatsApp notifications, PayFast or any online payment gateway, a separate mobile app, multi-organisation support, or user-facing self-registration.

---

## 16. Deployment

### 16.1 Supabase Setup

Create a Supabase project from the Supabase dashboard. Run each SQL migration file in order using the Supabase SQL editor. Set up the JWT custom claims function and hook. Run the seed SQL to create the admin profile. Note the project URL and anon key for use in environment variables.

### 16.2 Netlify Setup

Connect the GitHub repository to Netlify. Set the build command to npm run build. Set the publish directory to dist. Add two environment variables: VITE_SUPABASE_URL set to the Supabase project URL, and VITE_SUPABASE_ANON_KEY set to the anon key.

Ensure the public folder contains a file named _redirects with the content: /* /index.html 200

Without this file, refreshing any page other than the root will return a 404 from Netlify because Netlify does not know that React Router handles the routing.

### 16.3 Post-Deployment Checklist

Change the default admin password immediately after first login. Confirm HTTPS is active. Test the full workflow: register a member, record a payment, submit a claim, approve it, and generate a report. Confirm PDF downloads work on the live URL.

---

## Appendix A — Claim Status Colour Mapping

Submitted: blue badge
Under Review: amber badge
Approved: green badge
Rejected: red badge
Paid: teal badge

## Appendix B — Member Status Colour Mapping

Active: green badge
Suspended: amber badge
Deceased: grey badge
Resigned: dark badge
Inactive: light grey badge

## Appendix C — Prompt Template for Gemini

When asking Gemini to generate a specific feature, use this template for consistent results:

"I am building a Burial Society Management System using React with Vite, Tailwind CSS with custom brand colours (brand-green #2A8C34, brand-yellow #F5C518, brand-charcoal #3C3C3C), Supabase, React Router v6, Zustand for auth state only, React Hook Form with Zod for forms, and React Hot Toast for notifications.

The app has a public landing page at `/` and a login flow at `/login` with a role selection step before the email/password form. After logout, users are always redirected to `/` not `/login`.

All Supabase calls are made in service files — never in components. Service functions return `{ data, error }`. Three seed accounts exist: admin@pfukani.org (Admin), executive@pfukani.org (Executive), member@pfukani.org (Member).

I need you to build [specific feature]. The rules are:
- No Supabase calls in components — only in src/services/
- All forms use React Hook Form with a Zod schema
- Loading states on all async operations
- Error and success shown via React Hot Toast
- Tailwind CSS only, using the brand colour classes
- Follow the established folder structure
- Supabase table name is [table name], relevant columns are [columns]
- After logout always navigate to / not /login"

---

*This document is the single source of truth for the React version of the BSMS project. Share the relevant section with Gemini when building each feature. Update this document if any decision changes during development.*
