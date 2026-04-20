export const providerTitle = (provider) => {
  if (provider === "trello") return "Trello";
  if (provider === "clickup") return "ClickUp";
  if (provider === "googleworkspace") return "Google Workspace";
  return "Asana";
};

export const readCallbackResult = (search = "") => {
  const params = new URLSearchParams(search || "");
  return {
    error: params.get("error") || params.get("message") || "",
    errorDescription: params.get("error_description") || "",
  };
};
