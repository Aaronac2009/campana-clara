import type { CalendarEntry, Campaign, Profile } from "./types";

export const DEFAULT_PROFILE: Profile = {
  name: "Colegio Técnico Profesional Mercedes Norte",
  type: "Colegio técnico profesional",
  region: "",
  slogan: "Formación técnica con valores",
  primary: "#1d2b4f",
  secondary: "#2a8a85",
  accent: "#d4a84b",
  logoDataUrl: "",
  logoAuthorized: false,
};

const noEf = { enabled: false, name: "", date: "", sourceUrl: "", confirmed: false };

export function demoCampaigns(): Campaign[] {
  const base = {
    institutionType: "Colegio técnico profesional",
    institutionName: DEFAULT_PROFILE.name,
    audience: "Comunidad educativa",
    tone: "Formal e institucional",
    format: "afiche" as const,
    language: "Español",
    date: "",
    checklist: {},
    reviewer: "",
    approvalDate: "",
  };
  return [
    {
      ...base,
      id: "demo-convivir",
      title: "Convivir también se aprende",
      tagline: "El respeto se demuestra con acciones",
      bullets: [
        "Escuchá antes de responder.",
        "Respetá las diferencias y resolvé los conflictos por medio del diálogo.",
        "Descansá, hidratate, comé variado y movete según tus posibilidades.",
        "Cuidá los espacios que compartimos y colaborá con los demás.",
      ],
      cta: "Escuchá. Respetá. Cuidá. Colaborá.",
      note: "Campaña temática sin fecha conmemorativa asociada. Propuesta pendiente de revisión editorial.",
      campaignType: "Campaña temática",
      theme: "Convivencia, respeto y hábitos saludables",
      efemeride: noEf,
      status: "revision",
      checklist: { lenguaje: true, contraste: true },
      updatedAt: "2026-10-22T15:30:00.000Z",
    },
    {
      ...base,
      id: "demo-ciber",
      title: "Tu seguridad digital empieza por vos",
      tagline: "Pequeños hábitos que protegen a toda la comunidad",
      bullets: [
        "Usá contraseñas largas y distintas para cada cuenta.",
        "Activá la verificación en dos pasos cuando esté disponible.",
        "Pensá antes de compartir datos, fotos o ubicaciones.",
      ],
      cta: "Pensá. Protegé. Compartí con cuidado.",
      note: "Campaña temática sin fecha conmemorativa asociada. Propuesta pendiente de revisión editorial.",
      campaignType: "Ciberseguridad",
      theme: "Ciberseguridad y uso responsable de redes",
      audience: "Estudiantes",
      tone: "Juvenil y dinámico",
      format: "historia",
      efemeride: noEf,
      status: "borrador",
      updatedAt: "2026-10-20T10:00:00.000Z",
    },
    {
      ...base,
      id: "demo-mujer",
      title: "Día Internacional de la Mujer",
      tagline: "Igualdad que se construye todos los días",
      bullets: [
        "Reconozcamos los aportes de las mujeres de nuestra comunidad.",
        "Promovamos espacios seguros y de participación equitativa.",
        "Cuestionemos los estereotipos en el aula y fuera de ella.",
      ],
      cta: "Reconocé. Respetá. Participá.",
      note: "Vinculada a una efeméride pendiente de verificación. No publicar hasta confirmar fecha y fuente.",
      campaignType: "Conmemoración/efeméride",
      theme: "Igualdad y participación",
      format: "cuadrado",
      date: "2027-03-08",
      efemeride: { enabled: true, name: "Día Internacional de la Mujer", date: "2027-03-08", sourceUrl: "", confirmed: false },
      status: "borrador",
      updatedAt: "2026-10-18T09:00:00.000Z",
    },
    {
      ...base,
      id: "demo-hidratacion",
      title: "Cuidarnos es una tarea diaria",
      tagline: "Hábitos sencillos, bienestar compartido",
      bullets: ["Tomá agua durante la jornada.", "Preferí alimentos variados y frescos.", "Hacé pausas activas según tus posibilidades."],
      cta: "Hidratate. Movete. Descansá.",
      note: "Campaña temática sin fecha conmemorativa asociada.",
      campaignType: "Promoción de hábitos saludables",
      theme: "Hidratación y hábitos saludables",
      format: "whatsapp",
      efemeride: noEf,
      status: "aprobado",
      checklist: { datos: true, imagenes: true, logo: true, lenguaje: true, contraste: true },
      reviewer: "Comité editorial (demo)",
      approvalDate: "2026-10-15",
      updatedAt: "2026-10-15T14:00:00.000Z",
    },
  ];
}

export function demoCalendar(): CalendarEntry[] {
  return [
    { id: "cal-1", title: "Campaña temática: convivencia", date: "", kind: "tematica", sourceOrg: "", scope: "Institucional", note: "Sin fecha conmemorativa. Puede programarse en cualquier momento del curso lectivo." },
    { id: "cal-2", title: "Día Internacional de la Mujer", date: "2027-03-08", kind: "verificada", sourceOrg: "ONU Mujeres (demo)", scope: "Internacional", note: "Dato ilustrativo. Requiere validación institucional y enlace de fuente antes de usarse." },
    { id: "cal-3", title: "Anexión del Partido de Nicoya", date: "2027-07-25", kind: "pendiente", sourceOrg: "", scope: "Nacional", note: "Borrador pendiente de validación. No se ha registrado fuente." },
    { id: "cal-4", title: "Campaña temática: uso responsable de redes", date: "", kind: "tematica", sourceOrg: "", scope: "Institucional", note: "Sugerida para inicio de periodo. Sin fecha asociada." },
    { id: "cal-5", title: "Campaña temática: hábitos saludables", date: "", kind: "tematica", sourceOrg: "", scope: "Institucional", note: "Puede acompañar actividades deportivas o ferias de salud." },
  ];
}
