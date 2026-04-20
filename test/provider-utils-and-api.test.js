import test from "node:test";
import assert from "node:assert/strict";
import {
  SELECTED_PROVIDER_KEY,
  initialProviderFromStorage,
  normalizeProvider,
  providerTitle,
} from "../src/pages/integrations/providers/providerUtils.js";
import { getProviderAuthUrl } from "../src/pages/integrations/providers/api.js";

test("provider selection utilities support clickup and bamboohr", () => {
  assert.equal(normalizeProvider("clickup"), "clickup");
  assert.equal(normalizeProvider("trello"), "trello");
  assert.equal(normalizeProvider("bamboohr"), "bamboohr");
  assert.equal(normalizeProvider("unknown"), "asana");
  assert.equal(providerTitle("clickup"), "ClickUp");
  assert.equal(providerTitle("bamboohr"), "BambooHR");
});

test("initial provider resolves from storage", () => {
  const storageLike = {
    getItem: (key) => (key === SELECTED_PROVIDER_KEY ? "clickup" : null),
  };
  assert.equal(initialProviderFromStorage(storageLike), "clickup");
  assert.equal(initialProviderFromStorage({ getItem: () => "other" }), "asana");
});

test("clickup connect flow builds auth redirect URL", () => {
  const returnTo = "http://localhost:5173/integrations/clickup/callback";
  const authUrl = getProviderAuthUrl("clickup", returnTo);
  const url = new URL(authUrl);
  assert.equal(url.pathname, "/api/clickup/auth");
  assert.equal(url.searchParams.get("returnTo"), returnTo);
});

test("bamboohr connect flow builds auth redirect URL with companyDomain", () => {
  const returnTo = "http://localhost:5173/integrations/bamboohr/callback";
  const authUrl = getProviderAuthUrl("bamboohr", returnTo, {
    companyDomain: "acme",
  });
  const url = new URL(authUrl);
  assert.equal(url.pathname, "/api/bamboohr/auth");
  assert.equal(url.searchParams.get("returnTo"), returnTo);
  assert.equal(url.searchParams.get("companyDomain"), "acme");
});
