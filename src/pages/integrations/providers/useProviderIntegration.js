import { useMemo, useState } from "react";
import { message } from "antd";
import {
  disconnectBambooHr,
  getBambooHrEmployees,
  getBambooHrStatus,
  getProviderAuthUrl,
  getProviderProjects,
  importBambooHrEmployees,
  importProviderProjects,
} from "./api";
import {
  SELECTED_PROVIDER_KEY,
  initialProviderFromStorage,
  normalizeProvider,
  providerTitle,
} from "./providerUtils.js";

const initialState = () => ({
  asana: {
    loadingProjects: false,
    loadingImport: false,
    connected: Boolean(localStorage.getItem("asana_connected_at")),
    projectsResponse: null,
    importResponse: null,
    error: "",
    needsReconnect: false,
  },
  trello: {
    loadingProjects: false,
    loadingImport: false,
    connected: Boolean(localStorage.getItem("trello_connected_at")),
    projectsResponse: null,
    importResponse: null,
    error: "",
    needsReconnect: false,
  },
  clickup: {
    loadingProjects: false,
    loadingImport: false,
    connected: Boolean(localStorage.getItem("clickup_connected_at")),
    projectsResponse: null,
    importResponse: null,
    error: "",
    needsReconnect: false,
  },
  bamboohr: {
    loadingProjects: false,
    loadingImport: false,
    connected: Boolean(localStorage.getItem("bamboohr_connected_at")),
    companyDomain: localStorage.getItem("bamboohr_company_domain") || "",
    employeesResponse: null,
    importEmployeesResponse: null,
    error: "",
    needsReconnect: false,
  },
});

export function useProviderIntegration() {
  const [selectedProvider, setSelectedProvider] = useState(() =>
    initialProviderFromStorage(localStorage),
  );
  const [providerState, setProviderState] = useState(initialState);

  const selectProvider = (provider) => {
    const next = normalizeProvider(provider);
    setSelectedProvider(next);
    localStorage.setItem(SELECTED_PROVIDER_KEY, next);
  };

  const connect = (provider, options = {}) => {
    const p = normalizeProvider(provider);
    selectProvider(p);
    const returnTo = `${window.location.origin}/integrations/${p}/callback`;
    if (p === "bamboohr") {
      const companyDomain = String(
        options?.companyDomain ||
          providerState?.bamboohr?.companyDomain ||
          localStorage.getItem("bamboohr_company_domain") ||
          "",
      )
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\.bamboohr\.com\/?$/i, "")
        .replace(/\/.*/, "");
      if (!companyDomain) {
        message.error("Please enter your BambooHR subdomain.");
        return;
      }
      localStorage.setItem("bamboohr_company_domain", companyDomain);
      setProviderState((prev) => ({
        ...prev,
        bamboohr: { ...prev.bamboohr, companyDomain },
      }));
      window.location.assign(
        getProviderAuthUrl(p, returnTo, { companyDomain }),
      );
      return;
    }
    window.location.assign(getProviderAuthUrl(p, returnTo));
  };

  const loadProjects = async (provider) => {
    const p = normalizeProvider(provider);
    setProviderState((prev) => ({
      ...prev,
      [p]: { ...prev[p], loadingProjects: true, error: "", needsReconnect: false },
    }));
    try {
      if (p === "bamboohr") {
        const status = await getBambooHrStatus();
        if (!status.connected) {
          const msg = "BambooHR is not connected. Please reconnect and try again.";
          setProviderState((prev) => ({
            ...prev,
            bamboohr: {
              ...prev.bamboohr,
              loadingProjects: false,
              connected: false,
              error: msg,
              needsReconnect: true,
            },
          }));
          message.error(msg);
          return;
        }
        const data = await getBambooHrEmployees();
        setProviderState((prev) => ({
          ...prev,
          bamboohr: {
            ...prev.bamboohr,
            connected: true,
            employeesResponse: data,
            loadingProjects: false,
            error: "",
            needsReconnect: false,
          },
        }));
        localStorage.setItem("bamboohr_connected_at", String(Date.now()));
        message.success(`Loaded ${data.count} BambooHR employee(s).`);
        return;
      }

      const data = await getProviderProjects(p);
      setProviderState((prev) => ({
        ...prev,
        [p]: {
          ...prev[p],
          connected: true,
          projectsResponse: data,
          loadingProjects: false,
          needsReconnect: false,
        },
      }));
      message.success(`Loaded ${data.count} ${providerTitle(p)} project(s).`);
    } catch (err) {
      const notConnected =
        Number(err?.status) === 401 ||
        String(err?.message || "").toLowerCase().includes("unauthorized");
      const msg = notConnected
        ? `${providerTitle(p)} is not connected. Please reconnect and try again.`
        : err?.message ||
          `Failed to load ${providerTitle(p)} ${p === "bamboohr" ? "employees" : "projects"}.`;
      setProviderState((prev) => ({
        ...prev,
        [p]: {
          ...prev[p],
          loadingProjects: false,
          error: msg,
          connected: notConnected ? false : prev[p].connected,
          needsReconnect: notConnected,
        },
      }));
      message.error(msg);
    }
  };

  const importProjects = async (provider, options = {}) => {
    const p = normalizeProvider(provider);
    setProviderState((prev) => ({
      ...prev,
      [p]: { ...prev[p], loadingImport: true, error: "", needsReconnect: false },
    }));
    try {
      if (p === "bamboohr") {
        const data = await importBambooHrEmployees({
          employeeIds: options?.employeeIds,
        });
        setProviderState((prev) => ({
          ...prev,
          bamboohr: {
            ...prev.bamboohr,
            connected: true,
            importEmployeesResponse: data,
            loadingImport: false,
            needsReconnect: false,
          },
        }));
        localStorage.setItem("bamboohr_connected_at", String(Date.now()));
        message.success(
          `Imported ${data.count} employee(s) from BambooHR.`,
        );
        return;
      }

      const data = await importProviderProjects(p);
      setProviderState((prev) => ({
        ...prev,
        [p]: {
          ...prev[p],
          connected: true,
          importResponse: data,
          loadingImport: false,
          needsReconnect: false,
        },
      }));
      message.success(
        `Imported ${data.count} project(s) and ${data.ticketsCount || 0} ticket(s) from ${providerTitle(
          p,
        )}.`,
      );
    } catch (err) {
      const notConnected =
        Number(err?.status) === 401 ||
        String(err?.message || "").toLowerCase().includes("unauthorized");
      const msg = notConnected
        ? `${providerTitle(p)} is not connected. Please reconnect and try again.`
        : err?.message || `Failed to import ${providerTitle(p)} projects.`;
      setProviderState((prev) => ({
        ...prev,
        [p]: {
          ...prev[p],
          loadingImport: false,
          error: msg,
          connected: notConnected ? false : prev[p].connected,
          needsReconnect: notConnected,
        },
      }));
      message.error(msg);
    }
  };

  const setBambooHrCompanyDomain = (companyDomain) => {
    const value = String(companyDomain || "")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\.bamboohr\.com\/?$/i, "")
      .replace(/\/.*/, "");
    localStorage.setItem("bamboohr_company_domain", value);
    setProviderState((prev) => ({
      ...prev,
      bamboohr: { ...prev.bamboohr, companyDomain: value },
    }));
  };

  const disconnect = async (provider) => {
    const p = normalizeProvider(provider);
    if (p !== "bamboohr") return;
    setProviderState((prev) => ({
      ...prev,
      bamboohr: { ...prev.bamboohr, loadingImport: true, error: "" },
    }));
    try {
      await disconnectBambooHr();
      localStorage.removeItem("bamboohr_connected_at");
      setProviderState((prev) => ({
        ...prev,
        bamboohr: {
          ...prev.bamboohr,
          connected: false,
          loadingImport: false,
          needsReconnect: false,
          employeesResponse: null,
          importEmployeesResponse: null,
          error: "",
        },
      }));
      message.success("BambooHR disconnected.");
    } catch (err) {
      const msg = err?.message || "Failed to disconnect BambooHR.";
      setProviderState((prev) => ({
        ...prev,
        bamboohr: {
          ...prev.bamboohr,
          loadingImport: false,
          error: msg,
        },
      }));
      message.error(msg);
    }
  };

  const selectedData = useMemo(
    () => providerState[selectedProvider] || providerState.asana,
    [providerState, selectedProvider],
  );

  return {
    selectedProvider,
    providerState,
    selectedData,
    selectProvider,
    connect,
    loadProjects,
    importProjects,
    disconnect,
    setBambooHrCompanyDomain,
  };
}
