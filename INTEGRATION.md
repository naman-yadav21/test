Vendor create integration (local development)
===========================================

Business Unit creation is also connected: POST /api/business-units forwards
multipart field `data` containing {"data":{"appId":"...","business_unit":"..."}}
to workflow 7f5b84c1-28e2-11f1-a5f5-1315ec753140. It uses the same server token
and strict success checks. Its create response closes our form; the Lumenore
modal ID/reload event is not executed by this app. Business Unit editing is
blocked until an update workflow is supplied. Database listing/read-back and
status updates are not connected. Local displayed rows are not a database query.

The vendor form calls POST /api/vendors. The local Node API maps the form to
the supplied Lumenore workflow and sends multipart form field `data` containing
`{"data":{"appId":"...","vendor_name":"...",...}}`.

Setup:
1. Copy `.env.example` to `.env.local`.
2. Set LUMENORE_EMAIL, LUMENORE_PASSWORD and LUMENORE_TENANT_UUID locally.
   The tenant UUID is the tenantUuid from the second login-build request.
   Quote values containing # or spaces. Password is sent unchanged as JSON.
   Alternatively leave all three empty and set LUMENORE_TOKEN manually.
   Never put credentials in VITE_ variables, browser code, or Git.
3. Run `npm run api` and `npm run dev` in separate terminals.
4. Open http://localhost:5173. Submit one vendor and verify its record in Lumenore.

The supplied successful response is now checked explicitly: HTTP success plus
status.code === "200", status.value === "success", and error === false.
The returned goto/Admin Panel event is a Lumenore navigation instruction;
our app stays on its own Master data page. No response mapping env vars are needed.
No external write has been tested. Missing credentials block the workflow
before any data is sent. Workflow success is not independent verification of
an inserted database row; verify the first submission in the actual table.
An ambiguous response preserves the form and prevents another immediate submit;
check the actual table before closing/reopening and trying again.

Pending: local credentials, live automatic-login verification, real create verification,
vendor list API, live category/subcategory options, update/status workflows,
and production user authentication. The current login is a demo, directory
records are held in memory, and displayed IDs are local rather than database IDs.
The supplied workflow is used for creation only; vendor edits are blocked.
Other modules and status toggles retain their existing local demo behavior.

The Node bridge binds to loopback for local development. `vite preview` and a
static `dist` deployment do not provide this API. Before deployment, host an
authenticated backend, authorize vendor writes, configure the same-origin API
route and managed credentials/refresh according to Lumenore's supported auth.
Do not expose this development bridge as a public API.

Checks: `npm test` (mocked upstream only), `npm run build`.

Departments: POST /api/departments sends multipart data containing appId and
department to workflow 9bcd29ca-28e2-11f1-9d55-df8d0006bbb9. Creation is
connected; edits are blocked pending a separate update workflow. Live create
verification is pending. Business Unit creation was verified by the user.

Business Categories: POST /api/business-categories sends multipart data with
appId and business_category to workflow 8a7b6b6e-28e2-11f1-affd-c3b807b8cb2d.
Create is connected; live verification is pending. Edits require a separate
workflow. Department creation was verified by the user. Subdepartments are
explicitly deferred. Database listing remains pending.

Automatic login (local backend)
------------------------------
The backend POSTs email, password and tenantUuid to the observed fixed
https://apphub.lumenore.com/appsapi/secure/login-build endpoint and requires a
top-level token response. Login settings take precedence over a manual token;
partial login settings fail rather than silently using an old token.
Tokens stay in server memory. Concurrent saves share one login; subsequent
saves reuse the token until 30 seconds before its JWT expiry. The expiry is a
cache hint, not local signature validation. Unknown token formats are cached
for 60 seconds. Failed logins have a 30-second cooldown and block inserts.
This is automatic re-login, not a verified refresh-token API. Live compatibility
is still unverified; no supplied session token has been used or stored.
401 invalidates the cache for the next submission. Inserts are never automatically
replayed after a failure; check the table before retrying uncertain saves.
Restart npm run api after editing .env.local. Keep credentials server-only.
