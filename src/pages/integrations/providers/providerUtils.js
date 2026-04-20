export const normalizeProvider = (provider) => {
  if (
    provider === "trello" ||
    provider === "clickup" ||
    provider === "bamboohr"
  ) {
    return provider;
  }
  return "asana";
};

export const providerTitle = (provider) => {
  if (provider === "trello") return "Trello";
  if (provider === "clickup") return "ClickUp";
  if (provider === "bamboohr") return "BambooHR";
  return "Asana";
};

export const SELECTED_PROVIDER_KEY = "integrations_selected_provider";

export const initialProviderFromStorage = (storageLike) => {
  const fromStorage = storageLike?.getItem?.(SELECTED_PROVIDER_KEY);
  return normalizeProvider(fromStorage);
};
