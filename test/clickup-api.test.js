import test from "node:test";
import assert from "node:assert/strict";
import {
  clickUpProxyRequest,
  fetchClickUpProjectDetails,
  fetchClickUpProjects,
  getClickUpBackendAuthUrl,
  importClickUpProjects,
} from "../src/pages/integrations/ClickUp/api.js";

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

test("fetchClickUpProjects loads and normalizes projects/tasks", async () => {
  global.fetch = async (url) => {
    assert.match(String(url), /\/api\/clickup\/projects$/);
    return okResponse({
      source: "clickup",
      projects: [
        {
          id: "list_1",
          name: "Website backlog",
          workspaceName: "Marketing",
          tasks: [{ id: "t1", name: "Landing page", status: "open" }],
        },
      ],
    });
  };

  const out = await fetchClickUpProjects();
  assert.equal(out.source, "clickup");
  assert.equal(out.count, 1);
  assert.equal(out.projects[0].id, "list_1");
  assert.equal(out.projects[0].tickets[0].title, "Landing page");
});

test("fetchClickUpProjectDetails calls details endpoint and returns issues", async () => {
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
  assert.equal(out.source, "clickup");
  assert.equal(out.project.id, "list_99");
  assert.equal(out.issues.length, 1);
  assert.equal(out.issues[0].id, "task_9");
});

test("importClickUpProjects handles success and failure", async () => {
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
  assert.equal(ok.ticketsCount, 1);

  await assert.rejects(() => importClickUpProjects(), /import crashed/);
});

test("clickUpProxyRequest posts payload and returns backend data", async () => {
  global.fetch = async (url, options) => {
    assert.match(String(url), /\/api\/clickup\/proxy$/);
    assert.equal(options.method, "POST");
    const body = JSON.parse(String(options.body));
    assert.equal(body.path, "/list/1/task");
    return okResponse({ ok: true });
  };

  const out = await clickUpProxyRequest({ path: "/list/1/task", method: "GET" });
  assert.deepEqual(out, { ok: true });
});

test("getClickUpBackendAuthUrl includes returnTo", () => {
  const returnTo = "http://localhost:5173/projects?clickup_connected=1";
  const authUrl = new URL(getClickUpBackendAuthUrl(returnTo));
  assert.equal(authUrl.pathname, "/api/clickup/auth");
  assert.equal(authUrl.searchParams.get("returnTo"), returnTo);
});

