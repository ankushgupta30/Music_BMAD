/**
 * Editorial guesses for single/album release year (not from Spotify API).
 * Keys: `${song_name}|${artist_name}` lowercased — keep in sync with parsed-songs.json.
 */
const YEAR_BY_KEY: Record<string, number> = {
  "house of the rising sun|the animals": 1964,
  "attachments|shareh, hasan raheem, umair": 2023,
  "mehrbaan|ritviz, hasan raheem": 2021,
  "aaron rodgers|officialdjaaron": 2023,
  "afraid of the reaper|bigs & grim": 2024,
  "ctri+alttdel|the seige": 2020,
  "halo|gdk, noid": 2022,
  "r-cali|a$ap rocky": 2013,
  "this way|dilated peoples, kanye west": 2000,
  "if can't|50 cent": 2005,
  "all falls down|kanye west, syleena johnson": 2004,
  "goldie|a$ap rocky": 2013,
  "can't tell me nothing|kanye west": 2007,
  "you can't hide, you can't run|dilated peoples": 2001,
  "westside story|the game, 50 cent": 2005,
  "fire squad|j. cole": 2014,
  "here with me|d4vd": 2022,
  "true sorry|ibrahim maalouf": 2017,
  "el chapo - bonus track|the game, skrillex": 2015,
  "a whistling tune|elvis presley": 1962,
  "for whom the bell tolls|j. cole": 2016,
  "4your eyez only|j. cole": 2016,
  "traingazing|sam wills, honey mooncie": 2023,
  "ram pam - studio recording|zoe viccaji, shahab hussain, rohail hyatt": 2019,
  "kody blu 31|j. cole": 2021,
  "let god sort em out/chandeliers|clipse, nas, pusha t, malice": 2024,
  "mr. me too|clipse": 2006,
  "the fate of ophelia|taylor swift": 2024,
  "careful|nf, cordae": 2024,
  "churchill downs (feat. drake)|jack harlow, drake": 2022,
  "ghost town|kanye west, partynextdoor": 2018,
  "inglorious bastards|clipse, ab liva, pusha t, malice": 2006,
  "do better|ab-soul, zacari": 2014,
  "mibitf.|clipse, pusha t, malice": 2002,
  "get em high|kanye west, talib kweli, common": 2004,
  "the games we play|pushat": 2018,
  "bodies (feat. jid)|offset, jid": 2023,
  "virginia|clipse": 2002,
  "community (with clipse, pusha t & malice)|jid, clipse, pusha t, malice": 2022,
  "by the grace of god|clipse, pharrell williams, pusha t, malice": 2024,
  "ace trumpets - acolors show|clipse, colors": 2024,
  "so belt|clipse, pusha t, malice": 2024,
  "the devil is alie|rick ross, jay-z": 2014,
  "| guess|krsna": 2022,
  "schedule!|norman sann": 2021,
  "no one noticed|the marias": 2024,
  "sad gaana|bali, anik8t": 2023,
  "ek do ek|tsumyoki, rawal": 2023,
  "rang|chaar diwaari": 2024,
  "dharkay jiya|call": 2024,
  "ayyayyo|parimal shais, mc couper, thirumali, hanumankind": 2024,
  "fully loaded|tegi pannu, manni sandhu": 2023,
  "heart don't stand a chance|anderson .paak": 2016,
  "good kid|kendrick lamar": 2012,
  "wacced out murals|kendrick lamar": 2024,
  "not like us|kendrick lamar": 2024,
  "workin out|jid": 2018,
  "hair down|sir, kendrick lamar": 2019,
  "where's my love|syml": 2016,
  "womp womp|valee, jeremih": 2018,
  "everyday normal guy 2|jon lajoie": 2010,
  "dil hai tumhaara|alka yagnik, udit narayan, kumar sanu": 2002,
  "formation|beyoncé": 2016,
  "formation|beyonce": 2016,
  "if go, i'm goin|gregory alan isakov": 2009,
  "woman like a man - live radio session|damien rice": 2003,
};

function normalizeKey(song: string, artist: string): string {
  return `${song.trim()}|${artist.trim()}`.toLowerCase();
}

/** Returns guessed release year, or fallback when the catalog adds new rows. */
export function getEstimatedReleaseYear(
  songName: string,
  artistName: string,
  fallback = 2015
): number {
  const key = normalizeKey(songName, artistName);
  return YEAR_BY_KEY[key] ?? fallback;
}
