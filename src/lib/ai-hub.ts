/** Product lines for the AI hub. `status` is shown as-is, so keep it true. */
export type AiLine = {
  id: "front_desk" | "ai_search_site" | "agency_toolkit" | "done_for_you";
  name: string;
  status: string;
  pitch: string;
  ships: string[];
};

export const AI_LINES: AiLine[] = [
  {
    id: "front_desk",
    name: "AI Front Desk kits",
    status: "First kit in build: Restoria",
    pitch:
      "A Go High Level Voice AI and Conversation AI setup written for one trade, so the agent answers the 2 a.m. burst-pipe call like someone who has done the job.",
    ships: [
      "Voice AI receptionist: 24/7 answer, emergency triage, booking into your calendar",
      "Conversation AI for SMS, web chat, Facebook and Instagram",
      "Trade knowledge base: services, triage questions, what not to promise",
      "Missed-call text-back, form-to-pipeline and review-request workflows",
    ],
  },
  {
    id: "ai_search_site",
    name: "AI-search-ready sites",
    status: "Coming to every template",
    pitch:
      "Buyers now ask ChatGPT, Gemini, Perplexity and Google’s AI answers who to call. Each template will ship the structure those engines quote.",
    ships: [
      "LocalBusiness, Service and FAQ structured data, pre-mapped to the template",
      "Answer-first FAQ and service copy written per trade",
      "An llms.txt and a service-area page pattern",
    ],
  },
  {
    id: "agency_toolkit",
    name: "Agency AI toolkit",
    status: "Planned",
    pitch:
      "Prompts and Claude skills that re-skin a DesignPulse template for a new client in minutes: city, services, licenses, tone.",
    ships: [
      "Client intake to finished copy, per template",
      "Brand-safe image and alt-text briefs",
      "Launch checklist the agent runs before you publish",
    ],
  },
  {
    id: "done_for_you",
    name: "Done-for-you AI setup",
    status: "Early access",
    pitch:
      "We install, tune and test the front desk in your client’s sub-account under your agency’s name.",
    ships: [
      "Install and call testing in the client’s sub-account",
      "Knowledge base tuned to the client’s services and service area",
      "A2P and consent checklist completed with you",
    ],
  },
];

export const WAITLIST_ROLES: [string, string][] = [
  ["agency", "Agency"],
  ["business", "Business owner"],
  ["freelancer", "Freelancer"],
];

export const WAITLIST_TRADES = [
  "Restoration",
  "Garage doors",
  "Pest control",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Electrical",
  "Landscaping",
  "Cleaning",
  "Med spa",
  "Dental",
  "Law",
  "Real estate",
  "Other",
];
