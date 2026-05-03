import type { Translations } from "./index";

export const es: Translations = {
  tagline: "Un acompañante para quienes llevan lo que ven.",
  navEvidence: "Evidencia",
  navPrivacy: "Privacidad",

  eyebrow: "Para personas humanitarias",
  heroTitle: "Cargas mucho. Esto sostiene una parte contigo.",
  heroBody:
    "ShadowFile es un acompañante privado para quienes trabajan en ayuda humanitaria, crisis y primera línea. Contactos breves, reflexión basada en evidencia, redes de seguridad cuando hacen falta. No es clínico. No es la herramienta de tu empleador. Es tuyo.",

  offshiftTitle: "Cierre de turno",
  offshiftBody:
    "Noventa segundos. Di o escribe lo que más pesa ahora. Nada sale de tu dispositivo sin tu clave.",
  offshiftCta: "Empezar cierre",
  moralEntry: "Algo que necesito nombrar",
  moralEntryBody:
    "Un recorrido guiado sobre lesión moral para lo que no cabe dentro de un cierre normal.",
  moralEntryButton: "Abrir recorrido",
  sleepEntry: "Cómo fue el sueño",
  sleepEntryBody:
    "Un registro breve cada noche. Solo un número, guardado en este dispositivo sin contenido del diario.",
  sleepEntryButton: "Registrar sueño",
  proqolEntry: "Chequeo mensual ProQOL",
  proqolEntryBody:
    "Una pantalla de nueve ítems sobre satisfacción por compasión, agotamiento y estrés traumático secundario.",
  proqolEntryButton: "Abrir pantalla mensual",

  chatPlaceholder: "¿Qué quieres dejar hoy?",
  send: "Enviar",
  crisisCta: "Necesito ayuda ahora",
  crisisFooter: "En peligro inmediato, contacta a emergencias o a una línea de crisis local.",
  crisisModalEyebrow: "Apoyo en crisis",
  crisisModalUrgentEyebrow: "Quédate con apoyo ahora",
  crisisModalTitle: "Pediste ayuda inmediata.",
  crisisModalUrgentTitle: "Quiero mantener simple el siguiente paso.",
  crisisModalBody:
    "Elige tu país abajo. Puedes llamar a una línea de crisis, enviar un mensaje si esa opción existe, o avisar a alguien de confianza.",
  crisisModalUrgentBody:
    "Usa una de estas opciones ahora. Si una línea de crisis no responde, contacta a emergencias locales o a alguien que pueda quedarse contigo.",
  crisisModalCountry: "País",
  crisisModalLoading: "Cargando líneas de crisis…",
  crisisModalUnavailable:
    "No se pudo cargar una línea de crisis en este momento. Contacta a emergencias locales o a alguien que pueda quedarse contigo.",
  crisisModalWebsite: "Abrir recurso oficial",
  crisisModalCall: "Llamar ahora",
  crisisModalText: "Enviar mensaje",
  crisisModalNoText: "Abrir sitio web",
  crisisModalShareTitle: "Persona de confianza",
  crisisModalShareBody:
    "Puedes enviar un mensaje corto a alguien de confianza para no cargar esto a solas.",
  crisisModalShare: "Compartir mensaje",
  crisisModalClose: "Cerrar",

  cssrsTitle: "Una pantalla breve de seguridad",
  cssrsProgress: "Pregunta {current} de {total}",
  cssrsYes: "Sí",
  cssrsNo: "No",
  cssrsClose: "Cerrar",
  cssrsPositive:
    "Gracias por responder con claridad. Considera contactar una línea de crisis ahora.",
  cssrsOffer: "Si ayuda, puedo abrir otra vez las opciones de línea de crisis.",
  cssrsNegative:
    "Gracias por responder. Puedes volver al chat cuando quieras.",
  cssrsOpenCrisis: "Abrir líneas de crisis",
  cssrsReturn: "Volver al chat",

  passphraseLoading: "Cargando bloqueo del diario…",
  passphraseCreateEyebrow: "Diario privado",
  passphraseUnlockEyebrow: "Desbloquear diario",
  passphraseCreateTitle: "Crea una frase de acceso para tu diario.",
  passphraseUnlockTitle: "Introduce tu frase de acceso para desbloquear.",
  passphraseUnencryptedTitle: "Este diario está configurado en modo no cifrado en este dispositivo.",
  passphraseCreateBody:
    "No podemos recuperar esta frase de acceso. La clave derivada permanece solo en memoria en este dispositivo mientras la app está abierta.",
  passphraseUnlockBody:
    "Tu frase de acceso solo se usa para derivar la clave en memoria necesaria para desbloquear tu diario en este dispositivo.",
  passphraseUnencryptedBody:
    "Omitir el cifrado deja este diario legible en este dispositivo. Es menos privado que usar una frase de acceso.",
  passphraseLabel: "Frase de acceso",
  passphrasePlaceholder: "Introduce una frase de acceso",
  passphraseCreateSubmit: "Crear frase de acceso",
  passphraseUnlockSubmit: "Desbloquear diario",
  passphraseUnencryptedSubmit: "Continuar sin cifrado",
  passphraseSkip: "Omitir cifrado",
  passphraseErrorShort: "Usa al menos 8 caracteres.",
  passphraseErrorMissing: "Falta la sal guardada del diario en este dispositivo.",
  passphraseErrorWrong: "Esa frase de acceso no desbloqueó este diario.",
  passphraseErrorGeneric: "No se pudo desbloquear el diario en este momento.",

  moralEyebrow: "Recorrido de lesión moral",
  moralFlowTitle: "Algo que necesito nombrar.",
  moralBack: "Volver",
  moralBackHome: "Volver al inicio",
  moralYou: "Tú",
  moralProgress: "Paso {current} de {total}",
  moralPlaceholder: "Escribe tanto o tan poco como quieras.",
  moralContinue: "Continuar",
  moralDone: "Listo",
  moralError: "La conexión se cayó. Puedes volver a intentar este paso.",
  moralRetry: "Intentar de nuevo",
  moralComplete:
    "No tienes que resolver esto esta noche. Si quieres, puedes llevarlo a un cierre de turno en vez de dejarlo aquí.",
  moralRouteToCheckIn: "Ir al cierre",
  moralNameTitle: "Nombrarlo",
  moralNamePrompt:
    "¿Qué pasó? Descríbelo con todo el detalle que quieras. Nada de lo que digas aquí puede sorprenderme.",
  moralAxisTitle: "Nombrar el eje",
  moralAxisPrompt: "¿Eso se siente acertado?",
  moralCostTitle: "Lo que costó",
  moralCostPrompt: "¿Qué te quitó?",
  moralBeliefTitle: "Lo que todavía crees",
  moralBeliefPrompt:
    "A pesar de esto, ¿hay algo que todavía sostienes — sobre tu trabajo, o sobre la gente?",
  moralCarryTitle: "Cargar o dejar afuera",
  moralCarryPrompt:
    "¿Quieres quedarte con esto, o hay algo que quieres poner fuera de ti por esta noche?",

  sleepEyebrow: "Registro nocturno de sueño",
  sleepQuestion: "¿Cómo fue el sueño anoche?",
  sleepScaleHelp: "1 = casi nada, 5 = sólido",
  sleepAcknowledgment:
    "Anotado. Puedes dejarlo ahí o leer un texto corto de anclaje.",
  sleepLowAcknowledgment:
    "Eso suena a una noche difícil. Si quieres, puedes leer un texto corto de anclaje antes de cerrar.",
  sleepThreeHardNights:
    "Tres noches duras. Eso se acumula. ¿Hay algo que te está manteniendo despierto?",
  sleepRouteToCheckIn: "Ir al cierre de turno",
  sleepGroundingTitle: "Anclaje con recorrido corporal",
  sleepGroundingLine1:
    "Si quieres, deja que tus pies toquen el suelo o la cama y nota dónde cae tu peso.",
  sleepGroundingLine2:
    "Nota un lugar del cuerpo que esté apretado y otro que esté menos a la defensiva.",
  sleepGroundingLine3:
    "No tienes que cambiar nada. Solo marca lo que está ahí, un lugar a la vez.",
  sleepGroundingLine4:
    "Cuando estés listo, mira alrededor y nombra algunas cosas firmes que siguen aquí contigo.",
  sleepShowGrounding: "Leer texto de anclaje",
  sleepHideGrounding: "Ocultar texto de anclaje",
  sleepClose: "Cerrar",
  sleepNotePrompt: "¿Algo que quieras anotar antes de cerrar?",
  sleepNotePlaceholder: "Una línea es suficiente.",
  sleepSaveClose: "Guardar y cerrar",

  proqolEyebrow: "Pantalla mensual de salud laboral",
  proqolTitle: "Un chequeo breve ProQOL",
  proqolProgress: "Pregunta {current} de {total}",
  proqolScaleHelp: "1 = nunca, 5 = muy a menudo",
  proqolClose: "Cerrar",
  proqolRouteToCheckIn: "Ir al cierre de turno",
  proqolComplete: "Anotado. Puedes cerrar aquí.",
  proqolNotePrompt: "¿Alguna reflexión sobre lo que ves aquí?",
  proqolNotePlaceholder: "Opcional.",
  proqolSaveLogbook: "Guardar en el registro y cerrar",
  proqolFollowUp:
    "Hay señales de agotamiento o estrés traumático secundario. Si es seguro hacerlo, considera hablar con una supervisora, un supervisor o un profesional. También puedes llevar esto a un cierre de turno ahora.",
  proqolCSLabel: "Satisfacción por compasión",
  proqolBOLabel: "Agotamiento",
  proqolSTSLabel: "Estrés traumático secundario",
  proqolCSHigh: "la satisfacción por compasión está presente",
  proqolCSLow: "por debajo del umbral de la pantalla",
  proqolBOHigh: "hay señales de agotamiento",
  proqolBOLow: "por debajo del umbral de la pantalla",
  proqolSTSHigh: "hay señales de estrés traumático secundario",
  proqolSTSLow: "por debajo del umbral de la pantalla",

  notClinician:
    "ShadowFile es un acompañante entre pares, no clínico. Nunca sustituirá la atención profesional. En crisis, contacta una línea de crisis local o emergencias."
};
