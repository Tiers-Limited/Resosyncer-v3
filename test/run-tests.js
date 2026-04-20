import assert from "node:assert/strict";
import {
  SELECTED_PROVIDER_KEY,
  initialProviderFromStorage,
  normalizeProvider,
  providerTitle,
} from "../src/pages/integrations/providers/providerUtils.js";
import {
  disconnectBambooHr,
  getBambooHrAuthUrl,
  getBambooHrEmployees,
  getBambooHrStatus,
  getProviderAuthUrl,
  importBambooHrEmployees,
} from "../src/pages/integrations/providers/api.js";
import {
  clickUpProxyRequest,
  fetchClickUpProjectDetails,
  fetchClickUpProjects,
  getClickUpBackendAuthUrl,
  importClickUpProjects,
} from "../src/pages/integrations/ClickUp/api.js";
import {
  providerTitle as callbackProviderTitle,
  readCallbackResult,
} from "../src/pages/integrations/providerCallbackUtils.js";

const results = [];

const run = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};

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

global.window = { location: { origin: "http://localhost:5173" } };

await run("provider selection supports clickup", async () => {
  assert.equal(normalizeProvider("clickup"), "clickup");
  assert.equal(normalizeProvider("trello"), "trello");
  assert.equal(normalizeProvider("bamboohr"), "bamboohr");
  assert.equal(normalizeProvider("abc"), "asana");
  assert.equal(providerTitle("clickup"), "ClickUp");
  assert.equal(providerTitle("bamboohr"), "BambooHR");
});

await run("initial provider resolves from storage", async () => {
  const storageLike = {
    getItem: (key) => (key === SELECTED_PROVIDER_KEY ? "clickup" : null),
  };
  assert.equal(initialProviderFromStorage(storageLike), "clickup");
});

await run("connect flow auth URL uses clickup endpoint", async () => {
  const returnTo = "http://localhost:5173/integrations/clickup/callback";
  const authUrl = getProviderAuthUrl("clickup", returnTo);
  const url = new URL(authUrl);
  assert.equal(url.pathname, "/api/clickup/auth");
  assert.equal(url.searchParams.get("returnTo"), returnTo);
});

await run("bamboohr connect flow auth URL includes companyDomain", async () => {
  const returnTo = "http://localhost:5173/integrations/bamboohr/callback";
  const authUrl = getProviderAuthUrl("bamboohr", returnTo, {
    companyDomain: "acme",
  });
  const url = new URL(authUrl);
  assert.equal(url.pathname, "/api/bamboohr/auth");
  assert.equal(url.searchParams.get("returnTo"), returnTo);
  assert.equal(url.searchParams.get("companyDomain"), "acme");
});

await run("fetch projects and normalize for render", async () => {
  global.fetch = async () =>
    okResponse({
      projects: [
        {
          id: "list_1",
          name: "Website backlog",
          workspaceName: "Marketing",
          tasks: [{ id: "t1", name: "Landing page", status: "open" }],
        },
      ],
    });
  const out = await fetchClickUpProjects();
  assert.equal(out.count, 1);
  assert.equal(out.projects[0].tickets[0].title, "Landing page");
});

await run("fetch project details", async () => {
  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.pathname, "/api/clickup/projects/details");
    assert.equal(parsed.searchParams.get("projectId"), "list_99");
    return okResponse({
      project: { id: "list_99", name: "List 99", description: "Imported list" },
      tasks: [{ id: "task_9", name: "Task 9", status: { status: "in progress" } }],
    });
  };
  const out = await fetchClickUpProjectDetails("list_99");
  assert.equal(out.project.id, "list_99");
  assert.equal(out.issues.length, 1);
});

await run("import success and failure", async () => {
  let call = 0;
  global.fetch = async () => {
    call += 1;
    if (call === 1) {
      return okResponse({
        projects: [{ id: "l1", name: "List 1", tasks: [{ id: "t1", name: "T1" }] }],
      });
    }
    return failResponse(500, { message: "import crashed" });
  };
  const ok = await importClickUpProjects();
  assert.equal(ok.count, 1);
  await assert.rejects(() => importClickUpProjects(), /import crashed/);
});

await run("proxy request and clickup auth URL", async () => {
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/api\/clickup\/proxy$/);
    assert.equal(options.method, "POST");
    return okResponse({ ok: true });
  };
  const proxyOut = await clickUpProxyRequest({ path: "/list/1/task", method: "GET" });
  assert.deepEqual(proxyOut, { ok: true });

  const returnTo = "http://localhost:5173/projects?clickup_connected=1";
  const authUrl = new URL(getClickUpBackendAuthUrl(returnTo));
  assert.equal(authUrl.pathname, "/api/clickup/auth");
  assert.equal(authUrl.searchParams.get("returnTo"), returnTo);
});

await run("bamboohr status/employees/import/disconnect", async () => {
  let mode = "status";
  global.fetch = async (url, options = {}) => {
    const parsed = new URL(String(url));
    if (mode === "status") {
      assert.equal(parsed.pathname, "/api/bamboohr/status");
      return okResponse({ connected: true, companyDomain: "acme" });
    }
    if (mode === "employees") {
      assert.equal(parsed.pathname, "/api/bamboohr/employees");
      return okResponse({
        employees: [
          { id: "e1", firstName: "Ava", lastName: "Stone", workEmail: "ava@acme.com" },
        ],
      });
    }
    if (mode === "import") {
      assert.equal(parsed.pathname, "/api/bamboohr/import-employees");
      assert.equal(parsed.searchParams.get("employeeIds"), "e1");
      return okResponse({ employees: [{ id: "e1" }] });
    }
    assert.equal(parsed.pathname, "/api/bamboohr/disconnect");
    assert.equal(options.method, "POST");
    return okResponse({ ok: true });
  };

  const authUrl = new URL(
    getBambooHrAuthUrl(
      "acme",
      "http://localhost:5173/integrations/bamboohr/callback",
    ),
  );
  assert.equal(authUrl.pathname, "/api/bamboohr/auth");
  assert.equal(authUrl.searchParams.get("companyDomain"), "acme");

  const status = await getBambooHrStatus();
  assert.equal(status.connected, true);
  mode = "employees";
  const employees = await getBambooHrEmployees();
  assert.equal(employees.count, 1);
  mode = "import";
  const imported = await importBambooHrEmployees({ employeeIds: ["e1"] });
  assert.equal(imported.count, 1);
  mode = "disconnect";
  const disconnected = await disconnectBambooHr();
  assert.equal(disconnected.disconnected, true);
});

await run("bamboohr callback parsing", async () => {
  assert.equal(callbackProviderTitle("bamboohr"), "BambooHR");
  const ok = readCallbackResult("?code=abc");
  assert.equal(ok.error, "");
  const failed = readCallbackResult(
    "?error=access_denied&error_description=User%20denied",
  );
  assert.equal(failed.error, "access_denied");
  assert.equal(failed.errorDescription, "User denied");
});

const failed = results.filter((r) => !r.ok);
for (const result of results) {
  if (result.ok) {
    console.log(`PASS ${result.name}`);
  } else {
    console.error(`FAIL ${result.name}`);
    console.error(result.err);
  }
}

if (failed.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`All tests passed (${results.length}).`);
}
