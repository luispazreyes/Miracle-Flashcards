// Textos de la interfaz en español (CLAUDE.md, prototype-spec §B.4 y secciones F-nn). Sin librería i18n.
import type { DeckNameError, WordFormErrors } from '../domain/validation'

export const common = {
  genericError: 'No se pudo completar la acción. Inténtalo de nuevo.',
  offlineBanner: 'Sin conexión. Tus cambios se guardan en este dispositivo.',
  retry: 'Reintentar',
  cancel: 'Cancelar',
  loading: 'Cargando…',
  close: 'Cerrar',
}

export const deckNameErrors: Record<DeckNameError, string> = {
  empty: 'Escribe un nombre para el mazo.',
  'too-long': 'El nombre no puede pasar de 60 caracteres.',
  duplicate: 'Ya tienes un mazo con ese nombre. Elige otro.',
}

export const wordFieldNames = {
  english: 'Inglés',
  spanish: 'Español',
  imageUrl: 'Enlace de imagen',
}

export function wordFieldError(
  field: keyof WordFormErrors,
  code: NonNullable<WordFormErrors[keyof WordFormErrors]>,
): string {
  if (code === 'required')
    return `Falta el campo «${wordFieldNames[field]}». Escríbelo para guardar la palabra.`
  return 'El enlace no es http(s) o no carga como imagen.'
}

export const messages = {
  duplicateEnglish: 'Ya existe una palabra con ese inglés. Puedes continuar.',
  alreadyInDeck: (word: string) => `«${word}» ya está en este mazo.`,
  noResults: (text: string) => `Sin resultados para «${text}»`,
  invalidEmail: 'Escribe un correo válido.',
}

export const access = {
  appName: 'Miracle Flashcards',
  emailLabel: 'Correo electrónico',
  emailHelp: 'Te enviaremos un enlace para entrar, sin contraseña.',
  send: 'Enviar enlace de acceso',
  resend: 'Reenviar enlace',
  resendIn: (s: number) => `Reenviar enlace (${s} s)`,
  sentTitle: 'Revisa tu correo',
  sent: 'Revisa tu correo. El enlace caduca en 1 hora y solo se puede usar una vez.',
  countdown: (s: number) => `Podrás pedir otro enlace en ${s} segundos.`,
  canResend: 'Ya puedes pedir otro enlace.',
  invalidLink: 'Este enlace ya no es válido.',
  requestNew: 'Solicitar enlace nuevo',
  validating: 'Comprobando el enlace…',
  offline: 'Necesitas conexión para iniciar sesión por primera vez.',
  sendError: 'No se pudo enviar el enlace. Inténtalo de nuevo.',
  devNotice: 'Modo simulado: no se envió ningún correo real.',
  devOpen: 'Abrir el enlace de acceso',
}

export const shell = {
  skip: 'Saltar al contenido',
  mainNav: 'Navegación principal',
  decks: 'Mazos',
  progress: 'Progreso',
  settings: 'Ajustes',
  logout: 'Cerrar sesión',
  logoutTitle: '¿Cerrar sesión?',
  logoutUnsynced: 'Tienes cambios sin sincronizar. Si cierras sesión, se perderán.',
  logoutConfirmPlain: 'Se cerrará tu sesión en este dispositivo.',
  logoutAnyway: 'Cerrar sesión igualmente',
  notFoundTitle: 'Página no encontrada',
  notFoundText: 'La dirección no existe.',
  routeErrorTitle: 'Algo salió mal',
  backToDecks: 'Volver a mazos',
  remoteDeletedWord: (name: string) => `«${name}» se eliminó en otro dispositivo.`,
  remoteDeletedDeck: (name: string) => `El mazo «${name}» se eliminó en otro dispositivo.`,
  imageRemoved: (name: string) =>
    `No se pudo verificar la imagen de «${name}». Se quitó de la palabra.`,
}

export const decks = {
  title: 'Mazos',
  listLabel: 'Mazos',
  all: 'Todas las palabras',
  newDeck: 'Nuevo mazo',
  empty: 'Aún no tienes mazos. Crea el primero.',
  loadError: 'No se pudieron cargar los mazos.',
  study: 'Estudiar',
  studyAria: (name: string) => `Estudiar «${name}»`,
  studyEmpty: 'Este mazo no tiene palabras',
  words: (n: number) => (n === 1 ? '1 palabra' : `${n} palabras`),
  moreActions: (name: string) => `Más acciones de «${name}»`,
  rename: 'Renombrar',
  remove: 'Borrar',
  nameLabel: 'Nombre del mazo',
  counter: (n: number, max: number) => `${n}/${max}`,
  save: 'Guardar',
  create: 'Crear mazo',
  deleteTitle: (name: string) => `¿Borrar «${name}»?`,
  deleteText: 'Sus palabras se conservan y quedarán sin mazo. Esta acción no se puede deshacer.',
  deleteConfirm: 'Borrar mazo',
  selected: (name: string) => `Mazo «${name}» seleccionado.`,
  selectedAll: 'Mostrando todas las palabras.',
  created: (name: string) => `Mazo «${name}» creado.`,
  renamed: (name: string) => `Mazo renombrado a «${name}».`,
  deleted: (name: string) => `Mazo «${name}» borrado.`,
  tabDecks: 'Mazos',
  tabWords: 'Palabras',
  tabsLabel: 'Secciones',
}

export const words = {
  titleDeck: (name: string) => `Palabras de «${name}»`,
  titleAll: 'Todas las palabras',
  newWord: 'Nueva palabra',
  search: 'Buscar palabras',
  searchResults: (n: number) => (n === 1 ? '1 resultado.' : `${n} resultados.`),
  empty: 'Todavía no hay palabras. Crea la primera.',
  loadError: 'No se pudieron cargar las palabras.',
  groupDeck: 'En este mazo',
  groupOthers: 'En otros mazos',
  groupNone: 'Sin mazo',
  rowSr: (translation: string, where: string) => `, traducción ${translation}, ${where}`,
  whereDeck: 'en este mazo',
  whereOthers: 'en otros mazos',
  whereNone: 'sin mazo',
  whereAll: 'en la lista completa',
  addToDeck: 'Agregar a mazo',
  addToDeckAria: (word: string) => `Agregar «${word}» a un mazo`,
  searchDeck: 'Buscar mazo',
  moreActions: (word: string) => `Más acciones de «${word}»`,
  edit: 'Editar',
  remove: 'Borrar',
  removeFromDeck: 'Quitar de este mazo',
  added: (word: string, deck: string) => `«${word}» agregada a «${deck}».`,
  saved: 'Palabra guardada',
  unverified: 'Imagen sin verificar',
  deleteTitle: (word: string) => `¿Borrar «${word}»?`,
  deleteText: (n: number) =>
    n === 0
      ? 'No está en ningún mazo y se eliminará. No se puede deshacer.'
      : `Está en ${n === 1 ? '1 mazo' : `${n} mazos`} y se eliminará de ${n === 1 ? 'él' : 'todos'} junto con su progreso. No se puede deshacer.`,
  deleteConfirm: 'Borrar palabra',
  deleted: (word: string) => `Palabra «${word}» borrada.`,
  removeTitle: (word: string, deck: string) => `¿Quitar «${word}» de «${deck}»?`,
  removeText: 'La palabra no se borra, pero se elimina su progreso en este mazo.',
  removeConfirm: 'Quitar del mazo',
  removed: (word: string, deck: string) => `«${word}» se quitó de «${deck}».`,
}

export const wordForm = {
  titleNew: 'Nueva palabra',
  titleEdit: 'Editar palabra',
  english: 'Inglés (obligatorio)',
  spanish: 'Español (obligatorio)',
  image: 'Enlace de imagen',
  imageHelp: 'Opcional. Debe empezar por http o https.',
  example: 'Ejemplo de uso',
  note: 'Nota',
  save: 'Guardar palabra',
  checking: 'Comprobando imagen…',
  imageOk: 'La imagen carga correctamente.',
  imageOffline:
    'Sin conexión: la imagen se guardará sin verificar y se comprobará al volver la conexión.',
  imageAlt: 'Imagen de la palabra',
  errorSummary: 'Corrige estos campos para guardar la palabra:',
  saveError: 'No se pudo guardar la palabra. Inténtalo de nuevo.',
}

export const study = {
  title: 'Estudio',
  exit: 'Salir',
  pending: (n: number) => `Pendientes: ${n}`,
  loadError: 'No se pudo cargar la sesión de estudio.',
  flipHint: 'Toca o pulsa Espacio para ver la traducción',
  cardFront: (word: string) => `Tarjeta: ${word}. Pulsa para ver la traducción`,
  cardBack: (translation: string) => `Traducción: ${translation}`,
  example: 'Ejemplo',
  note: 'Nota',
  answerLabel: 'Tu respuesta',
  hit: 'Acerté',
  miss: 'No acerté',
  streak: (n: number, max: number) => `Aciertos seguidos: ${n} de ${max}`,
  learned: '¡Aprendida!',
  resultHit: '¡Acierto!',
  resultMiss: 'No acertaste. Vuelve en la siguiente ronda.',
  writeError: 'No se pudo guardar tu respuesta en este dispositivo.',
  endTitle: '¡Sesión terminada!',
  noPendingTitle: 'Este mazo no tiene palabras pendientes',
  noWordsTitle: 'Este mazo no tiene palabras',
  noWordsText: 'Agrega palabras al mazo para poder estudiarlo.',
  summaryHits: (n: number) => `Aciertos: ${n}`,
  summaryMisses: (n: number) => `Fallos: ${n}`,
  reactivate: 'Reactivar palabras',
  backToDecks: 'Volver a mazos',
}

export const progress = {
  title: 'Progreso',
  deckLabel: 'Mazo',
  noDecks: 'Crea un mazo para ver tu progreso.',
  goToDecks: 'Ir a mazos',
  noWords: 'Este mazo no tiene palabras.',
  loadError: 'No se pudo cargar el progreso.',
  pendingCount: (n: number) => `Pendientes: ${n}`,
  learnedCount: (n: number) => `Aprendidas: ${n}`,
  countersLabel: 'Contadores del mazo',
  barLabel: 'Avance del mazo',
  barText: (percent: number, learned: number, total: number) =>
    `${percent} % aprendidas (${learned} de ${total})`,
  tabsLabel: 'Estado de las palabras',
  tabPending: 'Pendientes',
  tabLearned: 'Aprendidas',
  emptyLearned: 'Aún no has aprendido ninguna palabra.',
  emptyPending: 'No quedan palabras pendientes.',
  streak: (n: number, max: number) => `Aciertos seguidos: ${n} de ${max}`,
  reactivate: 'Reactivar',
  reactivateAria: (word: string) => `Reactivar «${word}»`,
  reactivated: (word: string, deck: string) => `«${word}» vuelve a pendientes de «${deck}».`,
}

export const settings = {
  title: 'Ajustes',
  appearance: 'Apariencia',
  theme: 'Tema',
  backgroundPalette: 'Paleta de fondo',
  cardPalette: 'Paleta de tarjeta',
  imageSide: 'Lado de la imagen',
  imageSideHelp: 'Dónde se muestra la imagen de cada palabra durante el estudio.',
  preview: 'Vista previa',
  previewWord: 'Palabra A',
  previewTranslation: 'Palabra A-es',
  previewImage: 'Imagen',
  previewFront: 'Frente',
  previewBack: 'Reverso',
  saved: 'Guardado',
  account: 'Cuenta',
  signedInAs: (email: string) => `Sesión iniciada como ${email}.`,
  loadError: 'No se pudieron cargar los ajustes.',
}

export const drag = {
  handle: 'Arrastrar',
  dragging: (word: string) => `Arrastrando «${word}». Suéltala sobre un mazo.`,
  dropHere: 'Suelta aquí',
  cancelled: (word: string) => `Arrastre cancelado. «${word}» no cambió de mazo.`,
}
