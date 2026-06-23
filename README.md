Burial Society Management System (BSMS)
A cloud-based web application developed for Pfukani Magaza Burial Society — a Non-Profit Organisation based in Limpopo, South Africa. The system digitises member management, payment tracking, beneficiary records, burial claims processing, and financial reporting.

Live Demo
Deployed on Vercel: https://pfukani-magaza.vercel.app/

Problem Statement
Pfukani Magaza Burial Society manages member contributions and burial benefits for its community. The existing manual process relies on paper files and spreadsheets, leading to:

Delayed claim processing — locating payment histories and beneficiary records takes days when a member passes away
No financial visibility — contribution tracking is error-prone with no audit trail
No access control — anyone with physical access to files can view or modify sensitive member data
POPIA non-compliance — personal data is stored without consent tracking or access restrictions
BSMS solves these problems by providing a secure, role-based, cloud-hosted system that processes claims in hours instead of days.

Tech Stack
Layer	Technology	Purpose
Frontend	React 18 + Vite	Fast SPA with component-based architecture
Styling	Tailwind CSS 3	Utility-first responsive design
State	Zustand	Lightweight global state management
Forms	React Hook Form + Zod	Performant forms with runtime schema validation
Backend	Supabase	PostgreSQL database, Auth, RLS, Storage
PDF	jsPDF + AutoTable	Branded PDF report generation
Icons	Lucide React	Consistent icon library
Dates	date-fns	Date formatting and manipulation
Deployment	Vercel	Continuous deployment with SPA rewrites
Version Control	Git + GitHub	Source code management
Features
Five Core Modules
Module	Description
Member Management	Full CRUD operations — add, view, edit, delete members with search and status filters (Active, Inactive, Deceased)
Payment Management	Record payments, track history, generate receipts, update payment status
Beneficiary Management	Link multiple beneficiaries to each member with relationship types and contact details
Claims Processing	Multi-stage workflow: Submitted → Under Review → Approved → Paid / Rejected. Document upload to cloud storage. Approval restricted to Admin only.
Reporting	Generate Financial Summary, Membership, and Claims reports as branded PDF documents
Three User Roles
Role	Access Level	Key Capabilities
Admin	Full system access	All CRUD, claim approval, PDF reports, audit log, user management
Executive	Day-to-day operations	View/edit members, record payments, review claims (cannot approve or delete), limited reports
Member	Self-service only	View own profile, payments, beneficiaries; submit and track own claims
Security Features
Row Level Security (RLS) — every database table enforces access policies using a get_my_role() security definer function
Protected Routes — React route guards check authentication and role before rendering pages
Session Management — automatic logout after 60 minutes of inactivity with a 2-minute warning modal
Input Validation — Zod schemas validate all form data before database operations
POPIA Compliance — consent checkbox on member registration, data access controls per role
System Architecture
┌─────────────────────────────────────────────────────┐
│ React + Vite │
│ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│ │ Pages │ │Components│ │ Contexts / Hooks │ │
│ └────┬─────┘ └────┬─────┘ └──────────┬───────────┘ │
│ └─────────────┼─────────────────┘ │
│ ▼ │
│ ┌────────────────┐ │
│ │ Service Layer │ ← All Supabase calls │
│ │ (src/services) │ go through here │
│ └───────┬────────┘ │
│ ▼ │
│ ┌────────────────┐ │
│ │ Zod Validators│ ← Input validation │
│ │(src/validators)│ before DB writes │
│ └────────────────┘ │
└────────────────────┬────────────────────────────────┘
▼
┌─────────────────────────────────────────────────────┐
│ Supabase Cloud │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │PostgreSQL│ │ Auth │ │ Storage │ │
│ │ + RLS │ │ (JWT) │ │ (Claims) │ │
│ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────┘



---

## Project Structure

bsms/
├── public/
│ └── assets/ # Static assets (logo, favicon)
├── src/
│ ├── components/
│ │ ├── ui/ # Reusable UI components (SessionWarningModal, etc.)
│ │ ├── layout/ # Layout components (Sidebar, Navbar, etc.)
│ │ └── forms/ # Form components (MemberForm, ClaimForm, etc.)
│ ├── pages/ # Route pages (Dashboard, Members, Payments, etc.)
│ ├── services/ # Supabase API layer (memberService, paymentService, etc.)
│ ├── validators/ # Zod validation schemas (memberSchema, claimSchema, etc.)
│ ├── hooks/ # Custom hooks (useInactivityLogout, etc.)
│ ├── contexts/ # React contexts (AuthContext, etc.)
│ ├── utils/ # Utility functions (pdfGenerator, formatters, etc.)
│ ├── App.jsx # Root component with routing
│ └── main.jsx # Entry point
├── .env.example # Environment variable template
├── vercel.json # Vercel SPA rewrite configuration
├── tailwind.config.js # Tailwind CSS configuration
├── vite.config.js # Vite build configuration
├── package.json # Dependencies and scripts
└── README.md # This file



---

## Database Schema

### Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| profiles | User accounts linked to Supabase Auth | id, full_name, email, role, avatar_url |
| members | Burial society member records | id, first_name, last_name, id_number, phone, status, joined_date |
| payments | Member contribution payments | id, member_id, amount, payment_method, payment_date, status |
| beneficiaries | Members' designated beneficiaries | id, member_id, full_name, relationship, contact_phone |
| claims | Burial benefit claims with workflow | id, member_id, claim_type, status, amount_approved, submitted_at |
| claim_documents | Supporting documents for claims | id, claim_id, file_url, file_name, uploaded_at |
| audit_log | System activity audit trail | id, user_id, action, table_name, record_id, changed_at |

### Claim Status Workflow

Submitted → Under Review → Approved → Paid
└──→ Rejected (with reason)



### Row Level Security

All tables use RLS policies based on the get_my_role() security definer function:

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$   SELECT role FROM public.profiles WHERE id = auth.uid();
 $$;
Example policy (members table):

sql

-- Admins can read all members
CREATE POLICY "Admins can view all members"
ON public.members FOR SELECT
TO authenticated
USING (public.get_my_role() = 'admin');

-- Members can only read their own record
CREATE POLICY "Members can view own record"
ON public.members FOR SELECT
TO authenticated
USING (id = auth.uid());
Getting Started
Prerequisites
Node.js 18+ and npm
A Supabase account and project
Git for version control
Installation
Clone the repository
bash

git clone https://github.com/rezy-rex/PFUKANI-MAGAZA.git
cd bsms
Install dependencies
bash

npm install
Set up environment variables
Copy the example environment file and fill in your Supabase credentials:

bash

cp .env.example .env
Edit .env with your values:

env

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
Set up the Supabase database
Run the following SQL in the Supabase SQL Editor:

Create the get_my_role() security definer function
Create all tables (profiles, members, payments, beneficiaries, claims, claim_documents, audit_log)
Enable RLS on all tables and create policies
Create a storage bucket named claim-documents
Set up storage policies for authenticated uploads
Create user accounts
In the Supabase Dashboard → Authentication:

Create admin, executive, and member accounts
Insert corresponding records in the profiles table with the correct role
Start the development server
bash

npm run dev
The app will be available at http://localhost:5173

Available Scripts
Command
Description
npm run dev	Start the development server with hot reload
npm run build	Build the production bundle to dist/
npm run preview	Preview the production build locally
npm run lint	Run ESLint to check for code issues

Deployment
Vercel (Recommended)
Push the repository to GitHub
Import the project in Vercel
Set the framework preset to Vite
Add environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
Deploy
The vercel.json file handles SPA routing:

json

{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
Brand Guidelines
Element
Value
Brand Green	#2A8C34 — primary colour, headers, buttons
Brand Yellow	#F5C518 — accent colour, highlights, status badges
Brand Charcoal	#3C3C3C — text colour, sidebar background
Font Family	Inter (body), system sans-serif (fallback)

POPIA Compliance
The system includes the following measures to comply with the Protection of Personal Information Act (POPIA) of South Africa:

Consent tracking — POPIA consent checkbox on member registration
Purpose limitation — data is only used for burial society operations
Access control — members can only view their own data; admins and executives access is role-restricted
Data security — RLS policies enforce data protection at the database level
Session timeout — automatic logout after 60 minutes of inactivity
Audit trail — all data modifications are logged in the audit_log table
Challenges & Solutions
Challenge
Solution
RLS recursion on profiles table — policies referencing the same table they protect caused infinite recursion	Created a get_my_role() security definer function that bypasses RLS when checking the user's role
JWT custom hook 500 errors — Supabase JWT hooks intermittently returned server errors	Abandoned JWT custom claims in favour of the get_my_role() database function for reliable role lookup
Vercel SPA 404 on refresh — client-side routes returned 404 when refreshed or accessed directly	Added vercel.json with rewrites to route all requests to index.html
Storage upload RLS violations — claim document uploads failed due to missing storage policies	Added storage bucket policies for authenticated users to upload to claim-documents
PDF generation async failures — jsPDF crashed when logo image hadn't finished loading	Made the PDF generator async with await on image fetch, and switched from .webp to .png for compatibility

License
This project is developed as part of a Work Integrated Learning (WIL) assignment. All rights reserved.

Acknowledgements
Pfukani Magaza Burial Society — for providing the real-world problem and domain expertise
Supabase — for the open-source backend platform
Vercel — for free hosting and continuous deployment
