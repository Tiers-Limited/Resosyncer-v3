/**
 * @typedef {Object} IntegrationTicket
 * @property {string} id
 * @property {string} name
 * @property {string | null} [status]
 * @property {string | null} [url]
 * @property {string | null} [assigneeName]
 * @property {string | null} [dueAt]
 * @property {string | null} [sectionName]
 */

/**
 * @typedef {Object} ClickUpTicket
 * @property {string} id
 * @property {string} name
 * @property {string | null} [status]
 * @property {string | null} [url]
 * @property {string | null} [assigneeName]
 * @property {string | null} [dueAt]
 */

/**
 * @typedef {Object} IntegrationProject
 * @property {string} id
 * @property {string} name
 * @property {string | null} [url]
 * @property {string | null} [workspaceName]
 * @property {string[]} [sections]
 * @property {number} [sectionsCount]
 * @property {number} [ticketsCount]
 * @property {IntegrationTicket[]} [tickets]
 */

/**
 * @typedef {Object} ClickUpProject
 * @property {string} id
 * @property {string} name
 * @property {string | null} [url]
 * @property {string | null} [workspaceName]
 * @property {number} [ticketsCount]
 * @property {ClickUpTicket[]} [tickets]
 */

/**
 * @typedef {Object} BambooHrEmployee
 * @property {string} id
 * @property {string | null} [employeeId]
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [fullName]
 * @property {string} [preferredName]
 * @property {string} [workEmail]
 * @property {string} [homeEmail]
 * @property {string} [jobTitle]
 * @property {string} [department]
 * @property {string} [division]
 * @property {string} [location]
 * @property {string} [mobilePhone]
 * @property {string} [workPhone]
 * @property {string} [status]
 * @property {"bamboohr"} [source]
 * @property {any} [raw]
 */

/**
 * @typedef {Object} IntegrationProjectsResponse
 * @property {"asana" | "trello" | "clickup"} source
 * @property {number} count
 * @property {number} [ticketsCount]
 * @property {IntegrationProject[]} projects
 */

/**
 * @typedef {Object} IntegrationEmployeesResponse
 * @property {"bamboohr"} source
 * @property {number} count
 * @property {BambooHrEmployee[]} employees
 */

export const integrationTypes = {};
