# BSMS — Complete Supabase Setup Guide
## Run everything in this document before touching any React code

**What this document covers:**
Everything that must exist in Supabase before Gemini writes a single line of frontend code. By the end of this guide your database, security policies, storage, and first admin account will all be ready. You will then copy two values (the project URL and the anon key) into your React project's environment file and Gemini can connect immediately.

Work through each section in order. Do not skip ahead.

---

## Part 1 — Create the Supabase Project

### Step 1.1 — Sign Up or Log In

Go to https://supabase.com and sign in with GitHub or email. The free tier is sufficient for this project.

### Step 1.2 — Create a New Project

Click **New Project**.

Fill in the form:

| Field | Value |
|---|---|
| Organisation | Your personal org or create one named "PMF" |
| Project name | `pfukani-bsms` |
| Database password | Generate a strong password and **save it somewhere safe** — you will need it if you ever connect directly to the database |
| Region | Choose the closest to South Africa — currently **South Africa (Cape Town)** or **Europe West** if Cape Town is unavailable |
| Pricing plan | Free |

Click **Create new project** and wait. The project takes about 2 minutes to provision. The screen will show a progress indicator. Do not close the tab.

### Step 1.3 — Note Your API Keys

Once the project is ready, go to **Project Settings → API** in the left sidebar.

You will see two important values. Copy both and keep them somewhere — you will need them when setting up the React project:

**Project URL** — looks like `https://abcdefghijklmn.supabase.co`

**Anon / Public key** — a long string starting with `eyJ...`

Do not copy the **service_role** key. That key bypasses all security. It never goes into the frontend.

---

## Part 2 — Run the Database Migrations

Everything in this part is run in the **Supabase SQL Editor**. To open it: click **SQL Editor** in the left sidebar, then click **New query**.

Run each block one at a time. Copy the SQL, paste it into the editor, click **Run**, confirm it says "Success", then move to the next block.

---

### Migration 1 — Enable UUID Extension

```sql
create extension if not exists "uuid-ossp";
```

---

### Migration 2 — Create the Profiles Table

This extends the built-in Supabase auth users table with the extra fields the app needs. Every authenticated user will have a matching row in this table.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'executive', 'member')),
  member_id integer,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);
```

---

### Migration 3 — Create the Members Table

```sql
create table public.members (
  id serial primary key,
  member_number text not null unique,
  full_name text not null,
  id_number text not null unique,
  phone text not null,
  email text,
  physical_address text not null,
  status text not null default 'active' check (
    status in ('active', 'suspended', 'deceased', 'resigned', 'inactive')
  ),
  joined_date date not null default current_date,
  consent_given boolean not null default false,
  consent_date timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
```

---

### Migration 4 — Create the Payments Table

```sql
create table public.payments (
  id serial primary key,
  member_id integer not null references public.members(id),
  amount numeric(10, 2) not null check (amount > 0),
  month_year text not null,
  paid_at timestamptz not null default now(),
  receipt_number text not null unique,
  recorded_by uuid references auth.users(id),
  notes text
);
```

---

### Migration 5 — Create the Beneficiaries Table

```sql
create table public.beneficiaries (
  id serial primary key,
  member_id integer not null references public.members(id),
  full_name text not null,
  id_number text not null,
  relationship text not null check (
    relationship in ('Spouse', 'Child', 'Parent', 'Sibling', 'Other')
  ),
  phone text,
  date_of_birth date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
```

---

### Migration 6 — Create the Claims Table

```sql
create table public.claims (
  id serial primary key,
  member_id integer not null references public.members(id),
  beneficiary_id integer references public.beneficiaries(id),
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'approved', 'rejected', 'paid')
  ),
  submitted_at timestamptz not null default now(),
  submitted_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  amount_approved numeric(10, 2),
  paid_at timestamptz,
  rejection_reason text,
  notes text
);
```

---

### Migration 7 — Create the Claim Documents Table

```sql
create table public.claim_documents (
  id serial primary key,
  claim_id integer not null references public.claims(id) on delete cascade,
  file_name text not null,
  stored_path text not null,
  document_type text not null check (
    document_type in (
      'death_certificate',
      'member_id',
      'beneficiary_id',
      'funeral_quotation',
      'other'
    )
  ),
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references auth.users(id)
);
```

---

### Migration 8 — Create the Audit Logs Table

```sql
create table public.audit_logs (
  id serial primary key,
  table_name text not null,
  operation text not null,
  record_id text,
  user_id uuid not null,
  user_name text not null,
  changed_at timestamptz not null default now(),
  description text not null,
  previous_value text,
  new_value text
);
```

---

### Migration 9 — Add the Member ID Foreign Key to Profiles

This must run after both profiles and members are created:

```sql
alter table public.profiles
  add constraint profiles_member_id_fkey
  foreign key (member_id) references public.members(id);
```

---

### Migration 10 — Create Useful Indexes

These speed up the most common queries:

```sql
-- Members searched by name frequently
create index idx_members_full_name on public.members(full_name);

-- Payments looked up by member and month
create index idx_payments_member_id on public.payments(member_id);
create index idx_payments_month_year on public.payments(month_year);

-- Beneficiaries looked up by member
create index idx_beneficiaries_member_id on public.beneficiaries(member_id);

-- Claims filtered by status and member
create index idx_claims_member_id on public.claims(member_id);
create index idx_claims_status on public.claims(status);

-- Audit logs filtered by table and date
create index idx_audit_logs_table_name on public.audit_logs(table_name);
create index idx_audit_logs_changed_at on public.audit_logs(changed_at desc);
```

---

## Part 3 — Set Up the Profile Auto-Create Trigger

When a new user is created in Supabase Auth, this trigger automatically creates their profile row. Without this, you would have to insert the profile manually every time you create a user.

Run this in the SQL Editor:

```sql
-- Function that creates the profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

-- Trigger that fires the function after every new auth user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

---

## Part 4 — Set Up JWT Custom Claims for Roles

This is the mechanism that makes roles work in Row Level Security. The database needs to know the current user's role to apply the correct policies. Supabase Auth puts that role into the JWT token by calling this function.

### Step 4.1 — Create the Custom Claims Function

Run this in the SQL Editor:

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  -- Get the role from the profiles table
  select role into user_role
  from public.profiles
  where id = (event->>'userId')::uuid;

  claims := event->'claims';

  -- Add the role to the JWT claims
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"member"');
  end if;

  -- Return the modified event
  return jsonb_set(event, '{claims}', claims);
end;
$$;
```

### Step 4.2 — Grant Permissions for the Hook

```sql
grant usage on schema public to supabase_auth_admin;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;

revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
```

### Step 4.3 — Register the Hook in Supabase Dashboard

This cannot be done in the SQL Editor — it is a dashboard setting.

In the left sidebar go to **Authentication → Hooks**.

Find the section called **Customize Access Token (JWT) Claims**.

Click **Add hook**.

Set the hook type to **PostgreSQL Function**.

Select the schema **public** and the function **custom_access_token_hook**.

Click **Save**.

From this point, every JWT issued by Supabase Auth will contain a `user_role` field that the RLS policies can read.

---

## Part 5 — Enable Row Level Security and Create Policies

Row Level Security must be enabled on every table and then policies must be added. A table with RLS enabled but no policies is completely inaccessible to all users — so both steps are required for every table.

Run each block in the SQL Editor.

### Step 5.1 — Enable RLS on All Tables

```sql
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.payments enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.claims enable row level security;
alter table public.claim_documents enable row level security;
alter table public.audit_logs enable row level security;
```

### Step 5.2 — Profiles Table Policies

```sql
-- Users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can insert new profiles (account creation)
create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
```

### Step 5.3 — Members Table Policies

```sql
-- Admins and executives can read all members
create policy "Staff can view all members"
  on public.members for select
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Members can only read their own record
create policy "Members can view own record"
  on public.members for select
  using (
    (auth.jwt() ->> 'user_role') = 'member'
    and id = (
      select member_id from public.profiles
      where id = auth.uid()
    )
  );

-- Admins and executives can insert new members
create policy "Staff can insert members"
  on public.members for insert
  with check (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Admins and executives can update members
create policy "Staff can update members"
  on public.members for update
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );
```

### Step 5.4 — Payments Table Policies

```sql
-- Admins and executives can read all payments
create policy "Staff can view all payments"
  on public.payments for select
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Members can only read their own payments
create policy "Members can view own payments"
  on public.payments for select
  using (
    (auth.jwt() ->> 'user_role') = 'member'
    and member_id = (
      select member_id from public.profiles
      where id = auth.uid()
    )
  );

-- Admins and executives can insert payments
create policy "Staff can insert payments"
  on public.payments for insert
  with check (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Admins and executives can update payments
create policy "Staff can update payments"
  on public.payments for update
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );
```

### Step 5.5 — Beneficiaries Table Policies

```sql
-- Admins and executives can read all beneficiaries
create policy "Staff can view all beneficiaries"
  on public.beneficiaries for select
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Members can only read beneficiaries linked to their own member record
create policy "Members can view own beneficiaries"
  on public.beneficiaries for select
  using (
    (auth.jwt() ->> 'user_role') = 'member'
    and member_id = (
      select member_id from public.profiles
      where id = auth.uid()
    )
  );

-- Admins and executives can insert beneficiaries
create policy "Staff can insert beneficiaries"
  on public.beneficiaries for insert
  with check (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Admins and executives can update beneficiaries
create policy "Staff can update beneficiaries"
  on public.beneficiaries for update
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );
```

### Step 5.6 — Claims Table Policies

```sql
-- Admins and executives can read all claims
create policy "Staff can view all claims"
  on public.claims for select
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Members can only read claims linked to their own member record
create policy "Members can view own claims"
  on public.claims for select
  using (
    (auth.jwt() ->> 'user_role') = 'member'
    and member_id = (
      select member_id from public.profiles
      where id = auth.uid()
    )
  );

-- Admins and executives can submit claims
create policy "Staff can insert claims"
  on public.claims for insert
  with check (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Only admins can update claim status
create policy "Admins can update claims"
  on public.claims for update
  using (
    (auth.jwt() ->> 'user_role') = 'admin'
  );
```

### Step 5.7 — Claim Documents Table Policies

```sql
-- Admins and executives can read all claim documents
create policy "Staff can view all claim documents"
  on public.claim_documents for select
  using (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );

-- Members can read documents for their own claims
create policy "Members can view own claim documents"
  on public.claim_documents for select
  using (
    (auth.jwt() ->> 'user_role') = 'member'
    and claim_id in (
      select c.id from public.claims c
      join public.profiles p on p.member_id = c.member_id
      where p.id = auth.uid()
    )
  );

-- Admins and executives can upload documents
create policy "Staff can insert claim documents"
  on public.claim_documents for insert
  with check (
    (auth.jwt() ->> 'user_role') in ('admin', 'executive')
  );
```

### Step 5.8 — Audit Logs Table Policies

```sql
-- Only admins can read audit logs
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (
    (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Any authenticated user can insert audit log entries
-- (the service layer controls when this happens)
create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert
  with check (
    auth.uid() is not null
  );
```

---

## Part 6 — Create the Storage Bucket for Claim Documents

### Step 6.1 — Create the Bucket

In the left sidebar go to **Storage**.

Click **New bucket**.

| Setting | Value |
|---|---|
| Bucket name | `claim-documents` |
| Public bucket | OFF — leave this unchecked. Documents are private. |

Click **Save**.

### Step 6.2 — Add Storage Policies

Click on the **claim-documents** bucket, then click **Policies**, then **New policy**, then choose **For full customisation**.

Create the following policies one at a time.

**Policy 1 — Staff can upload files:**

- Policy name: `Staff can upload claim documents`
- Allowed operation: INSERT
- Target roles: authenticated
- Policy definition:
```sql
(auth.jwt() ->> 'user_role') in ('admin', 'executive')
```

**Policy 2 — Staff can read files:**

- Policy name: `Staff can read claim documents`
- Allowed operation: SELECT
- Target roles: authenticated
- Policy definition:
```sql
(auth.jwt() ->> 'user_role') in ('admin', 'executive')
```

**Policy 3 — Members can read their own claim files:**

- Policy name: `Members can read own claim documents`
- Allowed operation: SELECT
- Target roles: authenticated
- Policy definition:
```sql
(auth.jwt() ->> 'user_role') = 'member'
```

---

## Part 7 — Create the Three Seed Accounts

Three accounts must exist before the React app is built so all three roles can be tested immediately. Create them in this order.

### Step 7.1 — Create All Three Auth Users

In the left sidebar go to **Authentication → Users**. Click **Add user → Create new user** for each of the following. Tick **Auto confirm user** for all three.

**User 1 — Admin:**
| Field | Value |
|---|---|
| Email | admin@pfukani.org |
| Password | Admin@12345 |
| Auto confirm user | ON |

**User 2 — Executive:**
| Field | Value |
|---|---|
| Email | executive@pfukani.org |
| Password | Exec@12345 |
| Auto confirm user | ON |

**User 3 — Member:**
| Field | Value |
|---|---|
| Email | member@pfukani.org |
| Password | Member@12345 |
| Auto confirm user | ON |

The profile trigger will automatically create a profile row for each one with the default role of 'member'.

### Step 7.2 — Create the Seed Member Record

Before updating roles, create the member record that the member-role user will be linked to. Run this in the SQL Editor:

```sql
insert into public.members (
  member_number,
  full_name,
  id_number,
  phone,
  email,
  physical_address,
  status,
  joined_date,
  consent_given,
  consent_date
) values (
  'PM-2025-001',
  'Test Member',
  '9001015009087',
  '0712345678',
  'member@pfukani.org',
  '123 Main Street, Louis Trichardt, Limpopo',
  'active',
  '2025-01-01',
  true,
  now()
);
```

### Step 7.3 — Update All Three Profiles

Now update the three auto-created profile rows to set the correct roles and link the member user to their member record. Run this entire block:

```sql
-- Set admin role
update public.profiles
set
  role = 'admin',
  full_name = 'System Administrator',
  must_change_password = true
where id = (
  select id from auth.users where email = 'admin@pfukani.org'
);

-- Set executive role
update public.profiles
set
  role = 'executive',
  full_name = 'Executive User'
where id = (
  select id from auth.users where email = 'executive@pfukani.org'
);

-- Set member role and link to member record
update public.profiles
set
  role = 'member',
  full_name = 'Test Member',
  member_id = (
    select id from public.members where member_number = 'PM-2025-001'
  )
where id = (
  select id from auth.users where email = 'member@pfukani.org'
);
```

### Step 7.4 — Verify All Three Profiles

Run this to confirm everything is correctly set up:

```sql
select
  p.full_name,
  p.role,
  p.member_id,
  u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.role;
```

Expected result: three rows.

| full_name | role | member_id | email |
|---|---|---|---|
| System Administrator | admin | null | admin@pfukani.org |
| Executive User | executive | null | executive@pfukani.org |
| Test Member | member | 1 | member@pfukani.org |

The member_id for the Test Member row must not be null — if it is, the member dashboard cannot load their data. Re-run Step 7.3 if needed.

---

## Part 8 — Create Helper Database Functions

These are PostgreSQL functions that the React app's service layer will call to handle logic that must happen atomically on the database side.

### Function 1 — Generate the Next Member Number

```sql
create or replace function public.generate_member_number()
returns text
language plpgsql
as $$
declare
  current_year text;
  prefix text;
  next_seq integer;
  result text;
begin
  current_year := to_char(current_date, 'YYYY');
  prefix := 'PM-' || current_year || '-';

  select coalesce(
    max(
      cast(
        substring(member_number from length(prefix) + 1)
        as integer
      )
    ), 0
  ) + 1
  into next_seq
  from public.members
  where member_number like prefix || '%';

  result := prefix || lpad(next_seq::text, 3, '0');
  return result;
end;
$$;
```

### Function 2 — Generate the Next Receipt Number

```sql
create or replace function public.generate_receipt_number()
returns text
language plpgsql
as $$
declare
  today_str text;
  prefix text;
  next_seq integer;
  result text;
begin
  today_str := to_char(current_date, 'YYYYMMDD');
  prefix := 'RCP-' || today_str || '-';

  select coalesce(
    max(
      cast(
        substring(receipt_number from length(prefix) + 1)
        as integer
      )
    ), 0
  ) + 1
  into next_seq
  from public.payments
  where receipt_number like prefix || '%';

  result := prefix || lpad(next_seq::text, 3, '0');
  return result;
end;
$$;
```

### Function 3 — Count Active Beneficiaries for a Member

This function is called before adding a beneficiary to enforce the 10-beneficiary limit:

```sql
create or replace function public.get_active_beneficiary_count(p_member_id integer)
returns integer
language plpgsql
as $$
declare
  beneficiary_count integer;
begin
  select count(*)
  into beneficiary_count
  from public.beneficiaries
  where member_id = p_member_id
    and is_active = true;

  return beneficiary_count;
end;
$$;
```

### Function 4 — Check if Member Has Paid for a Given Month

```sql
create or replace function public.member_paid_for_month(
  p_member_id integer,
  p_month_year text
)
returns boolean
language plpgsql
as $$
declare
  payment_exists boolean;
begin
  select exists(
    select 1 from public.payments
    where member_id = p_member_id
      and month_year = p_month_year
  ) into payment_exists;

  return payment_exists;
end;
$$;
```

---

## Part 9 — Verify Everything is Set Up Correctly

Run each of these verification queries in the SQL Editor. Every one must return a result — if any return an error or empty when they should not, something in the earlier steps needs to be revisited.

### Check 1 — All Tables Exist

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;
```

Expected result: 7 rows — audit_logs, beneficiaries, claim_documents, claims, members, payments, profiles.

### Check 2 — RLS is Enabled on All Tables

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
```

Expected result: every row should have rowsecurity = true.

### Check 3 — All Policies Exist

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Expected result: you should see multiple policies for each table.

### Check 4 — All Three Seed Profiles Exist with Correct Roles

```sql
select p.full_name, p.role, p.member_id, u.email
from public.profiles p
join auth.users u on u.id = p.id
order by p.role;
```

Expected result: three rows — admin, executive, and member — with the member row having a non-null member_id.

### Check 5 — The Helper Functions Exist

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_type = 'FUNCTION'
order by routine_name;
```

Expected result: you should see custom_access_token_hook, generate_member_number, generate_receipt_number, get_active_beneficiary_count, handle_new_user, member_paid_for_month.

### Check 6 — The Storage Bucket Exists

Go to **Storage** in the left sidebar. You should see the `claim-documents` bucket listed.

### Check 7 — The Auth Hook is Registered

Go to **Authentication → Hooks**. The Customize Access Token section should show the custom_access_token_hook function selected.

---

## Part 10 — Collect Your Connection Values

Once all checks pass, collect these values for the React project. Gemini will need them to set up the `.env.local` file.

Go to **Project Settings → API**.

Copy the following:

**VITE_SUPABASE_URL**
Found under "Project URL". Looks like: `https://abcdefghijklmn.supabase.co`

**VITE_SUPABASE_ANON_KEY**
Found under "Project API keys" → "anon / public". It is the long string starting with `eyJ...`

These two values are the only things Gemini needs to connect the React app to your Supabase project. They go into a file called `.env.local` at the root of the React project, and that file must be listed in `.gitignore` so it is never committed to GitHub.

---

## Summary — What is Now Ready in Supabase

| Item | Status |
|---|---|
| 7 database tables with correct columns and constraints | Done |
| Unique indexes on member_number, id_number, receipt_number | Done |
| Performance indexes on commonly filtered columns | Done |
| Profile auto-create trigger (fires on new auth user) | Done |
| JWT custom claims hook (adds user_role to every token) | Done |
| Row Level Security enabled on all 7 tables | Done |
| RLS policies for all three roles on all tables | Done |
| claim-documents storage bucket (private) | Done |
| Storage policies for the bucket | Done |
| Admin seed account (admin@pfukani.org / Admin@12345) | Done |
| Executive seed account (executive@pfukani.org / Exec@12345) | Done |
| Member seed account (member@pfukani.org / Member@12345) | Done |
| Seed member record (PM-2025-001) linked to member profile | Done |
| Helper functions for member number, receipt number, beneficiary count, payment check | Done |

The database is fully ready. Hand Gemini the project URL and anon key and building can begin.
