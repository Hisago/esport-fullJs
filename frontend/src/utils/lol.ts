/** 🔧 Normalise un nom pour comparaison (lowercase + sans tirets/espaces) */
export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[\s\-]/g, '')
    .trim()

/** 🏆 Noms de ligues associées à des événements spéciaux */
export const specialEventLeagues = ['midseasoninvitational', 'esportsworldcup', 'firststand', 'worldchampionship']
