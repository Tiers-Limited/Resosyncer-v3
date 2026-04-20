import test from "node:test";
import assert from "node:assert/strict";
import {
  disconnectBambooHr,
  getBambooHrAuthUrl,
  getBambooHrEmployees,
  getBambooHrStatus,
  importBambooHrEmployees,
} from "../src/pages/integrations/providers/api.js";
import {
  providerTitle,
  readCallbackResult,
} from "../src/pages/integrations/providerCallbackUtils.js";

const okResponse = (data) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

const failResponse = (status, payload) => ({
  ok: false,
  status,
  json: async () => payload,
});

test.beforeEach(() => {
  global.window = { location: { origin: "http://localhost:5173" } };
});

test("bamboohr auth URL includes companyDomain and returnTo", () => {
  const returnTo = "http://localhost:5173/integrations/bamboohr/callback";
  const authUrl = new URL(getBambooHrAuthUrl("acme", returnTo));
  assert.equal(authUrl.pathname, "/api/bamboohr/auth");
  assert.equal(authUrl.searchParams.get("companyDomain"), "acme");
  assert.equal(authUrl.searchParams.get("returnTo"), returnTo);
});

test("bamboohr status returns connected state", async () => {
  global.fetch = async (url) => {
    assert.match(String(url), /\/api\/bamboohr\/status$/);
    return okResponse({ connected: true, companyDomain: "acme" });
  };

  const status = await getBambooHrStatus();
  assert.equal(status.connected, true);
  assert.equal(status.companyDomain, "acme");
});

test("bamboohr employees fetch normalizes employee records", async () => {
  global.fetch = async (url) => {
    assert.match(String(url), /\/api\/bamboohr\/employees$/);
    return okResponse({
      employees: [
        {
          id: "42",
          firstName: "Ava",
          lastName: "Stone",
          workEmail: "ava@acme.com",
          department: "Engineering",
          jobTitle: "Developer",
          status: "active",
          source: "bamboohr",
        },
      ],
    });
  };

  const out = await getBambooHrEmployees();
  assert.equal(out.source, "bamboohr");
  assert.equal(out.count, 1);
  assert.equal(out.employees[0].fullName, "Ava Stone");
  assert.equal(out.employees[0].workEmail, "ava@acme.com");
});

test("bamboohr import supports selected employee ids and handles failure", async () => {
  let call = 0;
  global.fetch = async (url) => {
    call += 1;
    const parsed = new URL(String(url));
    if (call === 1) {
      assert.equal(parsed.pathname, "/api/bamboohr/import-employees");
      assert.equal(parsed.searchParams.get("employeeIds"), "42,99");
      return okResponse({ employees: [{ id: "42" }, { id: "99" }] });
    }
    return failResponse(500, { message: "import failed" });
  };

  const ok = await importBambooHrEmployees({ employeeIds: ["42", "99"] });
  assert.equal(ok.count, 2);
  await assert.rejects(() => importBambooHrEmployees(), /import failed/);
});

test("bamboohr disconnect calls endpoint", async () => {
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/api\/bamboohr\/disconnect$/);
    assert.equal(options.method, "POST");
    return okResponse({ ok: true });
  };

  const out = await disconnectBambooHr();
  assert.equal(out.ok, true);
  assert.equal(out.disconnected, true);
});

test("callback helper parses success and error states", () => {
  const ok = readCallbackResult("?code=abc");
  assert.equal(ok.error, "");
  assert.equal(ok.errorDescription, "");
  assert.equal(providerTitle("bamboohr"), "BambooHR");

  const failed = readCallbackResult(
    "?error=access_denied&error_description=User%20denied",
  );
  assert.equal(failed.error, "access_denied");
  assert.equal(failed.errorDescription, "User denied");
});
