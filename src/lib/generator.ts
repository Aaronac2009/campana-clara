// Deterministic, template-based demo generator. No AI backend.
export interface GenInput {
  theme: string;
  campaignType: string;
  tone: string;
  audience: string;
  efemerideEnabled: boolean;
  efemerideName: string;
}
export interface GenOutput {
  title: string;
  tagline: string;
  bullets: string[];
  cta: string;
  note: string;
}

const THEMATIC_NOTE = "Campaña temática sin fecha conmemorativa asociada. Propuesta pendiente de revisión editorial.";

const TEMPLATES: { match: RegExp; out: Omit<GenOutput, "note">; en: Omit<GenOutput, "note"> }[] = [
  {
    match: /conviv|respeto|valores/i,
    out: {
      title: "Convivir también se aprende",
      tagline: "El respeto se demuestra con acciones",
      bullets: [
        "Escuchá antes de responder.",
        "Respetá las diferencias y resolvé los conflictos por medio del diálogo.",
        "Descansá, hidratate, comé variado y movete según tus posibilidades.",
        "Cuidá los espacios que compartimos y colaborá con los demás.",
      ],
      cta: "Escuchá. Respetá. Cuidá. Colaborá.",
    },
    en: {
      title: "Living together is learned too",
      tagline: "Respect is shown through actions",
      bullets: [
        "Listen before you answer.",
        "Respect differences and resolve conflicts through dialogue.",
        "Rest, stay hydrated, eat a varied diet and move as you are able.",
        "Take care of shared spaces and work together with others.",
      ],
      cta: "Listen. Respect. Care. Collaborate.",
    },
  },
  {
    match: /ciber|digital|contraseñ|redes/i,
    out: {
      title: "Tu seguridad digital empieza por vos",
      tagline: "Pequeños hábitos que protegen a toda la comunidad",
      bullets: [
        "Usá contraseñas largas y distintas para cada cuenta.",
        "Activá la verificación en dos pasos cuando esté disponible.",
        "Pensá antes de compartir datos, fotos o ubicaciones.",
        "Si algo te incomoda en línea, contáselo a una persona de confianza.",
      ],
      cta: "Pensá. Protegé. Compartí con cuidado.",
    },
    en: {
      title: "Your digital safety starts with you",
      tagline: "Small habits that protect the whole community",
      bullets: [
        "Use long, different passwords for each account.",
        "Turn on two-step verification whenever it is available.",
        "Think before sharing personal data, photos or locations.",
        "If something online makes you uncomfortable, tell someone you trust.",
      ],
      cta: "Think. Protect. Share with care.",
    },
  },
  {
    match: /salud|hidrat|aliment|hábito|habito/i,
    out: {
      title: "Cuidarnos es una tarea diaria",
      tagline: "Hábitos sencillos, bienestar compartido",
      bullets: [
        "Tomá agua durante la jornada.",
        "Preferí alimentos variados y frescos.",
        "Hacé pausas activas según tus posibilidades.",
        "Dormí lo suficiente para rendir mejor.",
      ],
      cta: "Hidratate. Movete. Descansá.",
    },
    en: {
      title: "Taking care of ourselves is a daily task",
      tagline: "Simple habits, shared well-being",
      bullets: [
        "Drink water throughout the day.",
        "Choose varied, fresh food.",
        "Take active breaks as you are able.",
        "Get enough sleep to do your best.",
      ],
      cta: "Hydrate. Move. Rest.",
    },
  },
  {
    match: /ambient|recicl|agua|planeta/i,
    out: {
      title: "Lo que cuidamos, permanece",
      tagline: "Acciones cotidianas por nuestro entorno",
      bullets: [
        "Separá los residuos en los recipientes indicados.",
        "Cerrá la llave mientras no usés el agua.",
        "Apagá luces y equipos que no estén en uso.",
        "Reutilizá materiales antes de desecharlos.",
      ],
      cta: "Separá. Ahorrá. Reutilizá.",
    },
    en: {
      title: "What we care for, endures",
      tagline: "Everyday actions for our environment",
      bullets: [
        "Sort waste into the designated bins.",
        "Turn off the tap when you are not using water.",
        "Switch off lights and devices that are not in use.",
        "Reuse materials before throwing them away.",
      ],
      cta: "Sort. Save. Reuse.",
    },
  },
];

export function generateProposal(input: GenInput): GenOutput {
  const tpl = TEMPLATES.find((t) => t.match.test(input.theme))?.out;
  const base: Omit<GenOutput, "note"> = tpl ?? {
    title: input.theme.trim() ? capitalize(input.theme.trim()) : "Comuniquemos con propósito",
    tagline: `Un mensaje para ${input.audience.toLowerCase()}`,
    bullets: [
      "Informate en fuentes confiables.",
      "Participá con respeto en las actividades.",
      "Compartí este mensaje con tu comunidad.",
    ],
    cta: "Participá. Compartí. Construí comunidad.",
  };
  let title = base.title;
  if (input.efemerideEnabled && input.efemerideName.trim()) title = input.efemerideName.trim();
  const note = input.efemerideEnabled
    ? "Vinculada a una efeméride pendiente de verificación. No publicar hasta confirmar fecha y fuente."
    : THEMATIC_NOTE;
  return { ...base, title, note };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface BilingualOutput { es: GenOutput; en: GenOutput }
const EN_THEMATIC_NOTE = "Thematic campaign with no associated commemorative date. Proposal pending editorial review.";
/**
 * Local template output in both languages. English is only produced from
 * hand-written English templates; free text typed by the user (custom theme,
 * commemoration name) is never copied into English, so those fields stay empty
 * and are flagged as pending translation.
 */
export function generateBilingual(input: GenInput): BilingualOutput {
  const es = generateProposal(input);
  const tpl = TEMPLATES.find((t) => t.match.test(input.theme))?.en;
  const custom = input.efemerideEnabled && input.efemerideName.trim();
  const en: GenOutput = tpl
    ? { ...tpl, title: custom ? "" : tpl.title, note: input.efemerideEnabled ? "Linked to a commemoration pending verification. Do not publish until the date and source are confirmed." : EN_THEMATIC_NOTE }
    : { title: "", tagline: "", bullets: ["Get information from reliable sources.", "Take part respectfully in the activities.", "Share this message with your community."], cta: "Take part. Share. Build community.", note: EN_THEMATIC_NOTE };
  return { es, en };
}
