import {
  INTEGRATIONS_BACKEND_BASE,
  bambooHrProxyRequest,
  disconnectBambooHr,
  getBambooHrAuthUrl,
  getBambooHrEmployees,
  getBambooHrStatus,
  importBambooHrEmployees,
} from "../providers/api";

export const BAMBOOHR_BACKEND_BASE = `${INTEGRATIONS_BACKEND_BASE}/api/bamboohr`;

export {
  bambooHrProxyRequest,
  disconnectBambooHr,
  getBambooHrAuthUrl,
  getBambooHrEmployees,
  getBambooHrStatus,
  importBambooHrEmployees,
};
