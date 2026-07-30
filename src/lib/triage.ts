export type TriageAnswer = { questionId: string; label: string; weight: number };

export type TriageQuestion = {
  id: string;
  prompt: string;
  options: { label: string; weight: number }[];
};

export const triageQuestions: TriageQuestion[] = [
  {
    id: "consciousness",
    prompt: "Is the person conscious and responding to you?",
    options: [
      { label: "Fully alert", weight: 0 },
      { label: "Drowsy or confused", weight: 3 },
      { label: "Unresponsive", weight: 5 },
    ],
  },
  {
    id: "breathing",
    prompt: "How is their breathing?",
    options: [
      { label: "Normal", weight: 0 },
      { label: "Fast or laboured", weight: 3 },
      { label: "Not breathing", weight: 5 },
    ],
  },
  {
    id: "bleeding",
    prompt: "Is there visible bleeding?",
    options: [
      { label: "None", weight: 0 },
      { label: "Minor bleeding", weight: 1 },
      { label: "Heavy or spurting", weight: 5 },
    ],
  },
  {
    id: "pain",
    prompt: "How severe is the pain?",
    options: [
      { label: "Mild", weight: 0 },
      { label: "Moderate", weight: 2 },
      { label: "Severe / chest pain", weight: 4 },
    ],
  },
  {
    id: "mobility",
    prompt: "Can they move safely away from danger?",
    options: [
      { label: "Yes, freely", weight: 0 },
      { label: "With difficulty", weight: 2 },
      { label: "No, trapped or immobile", weight: 4 },
    ],
  },
];

export type Severity = "low" | "medium" | "high" | "critical";

export function scoreToSeverity(score: number): Severity {
  if (score >= 12) return "critical";
  if (score >= 7) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export const severityMeta: Record<
  Severity,
  { label: string; status: "safe" | "warning" | "critical" | "active"; summary: string }
> = {
  low: {
    label: "Low severity",
    status: "safe",
    summary: "Self-care is likely enough. Keep monitoring and call for help if anything changes.",
  },
  medium: {
    label: "Medium severity",
    status: "active",
    summary: "Get seen by a clinician today. Do not leave the person alone.",
  },
  high: {
    label: "High severity",
    status: "warning",
    summary: "Urgent care needed. Trigger an SOS and prepare for responders to arrive.",
  },
  critical: {
    label: "Critical severity",
    status: "critical",
    summary: "Life-threatening. Trigger SOS immediately and begin first aid now.",
  },
};

export function firstAidSteps(answers: Record<string, string>, severity: Severity): string[] {
  const steps: string[] = ["Check the scene is safe before approaching."];

  if (answers.breathing === "Not breathing") {
    steps.push("Start CPR: 30 chest compressions at 100–120/min, then 2 rescue breaths. Repeat.");
    steps.push("Send someone for an AED if one is nearby.");
  } else if (answers.consciousness === "Unresponsive") {
    steps.push("Place them in the recovery position on their side and keep the airway open.");
  }

  if (answers.bleeding === "Heavy or spurting") {
    steps.push("Apply firm direct pressure with a clean cloth. Do not remove soaked dressings — add more on top.");
    steps.push("Raise the injured limb above heart level if there is no suspected fracture.");
  } else if (answers.bleeding === "Minor bleeding") {
    steps.push("Clean the wound with water and cover it with a sterile dressing.");
  }

  if (answers.pain === "Severe / chest pain") {
    steps.push("Keep them still and seated. Loosen tight clothing and monitor breathing closely.");
  }

  if (answers.mobility === "No, trapped or immobile") {
    steps.push("Do not move them unless there is immediate danger — wait for trained responders.");
  }

  steps.push("Keep them warm, talk calmly and stay with them until help arrives.");

  if (severity === "critical" || severity === "high") {
    steps.push("Trigger an AEGIS SOS now so responders and your contacts get your live location.");
  }

  return steps;
}