const HOCKEY_COMPETITIONS = [
  { key: "placard", name: "Campeonato Placard", path: "/hp/placard" },
  {
    key: "hockey-feminino",
    name: "Campeonato Nacional Feminino",
    path: "/hp/campeonato-nacional-feminino"
  },
  { key: "hockey-2d", name: "Campeonato Nacional 2ª Divisão", path: "/hp/2da-divisao" },
  { key: "hockey-3d", name: "Campeonato Nacional 3ª Divisão", path: "/hp/3a-divisao" },
  { key: "taca-portugal", name: "Taça de Portugal", path: "/hp/taca-portugal" },
  { key: "super-tacas", name: "Super Taças", path: "/hp/super-tacas" },
  { key: "sub13", name: "Campeonato Nacional Sub 13 Masculino", path: "/hp/cnsub13" },
  { key: "sub15", name: "Campeonato Nacional Sub 15 Masculino", path: "/hp/cnsub15" },
  { key: "sub17", name: "Campeonato Nacional Sub 17 Masculino", path: "/hp/cnsub17" },
  { key: "sub19", name: "Campeonato Nacional Sub 19 Masculino", path: "/hp/cnsub19" },
  { key: "sub19-fem", name: "Campeonato Nacional Sub 19 Feminino", path: "/hp/cnsub19-fem" },
  { key: "sub23", name: "Campeonato Nacional Sub 23", path: "/hp/cnsub23" },
  { key: "elite-cup", name: "Elite Cup", path: "/hp/elite-cup" },
  { key: "inter-regioes", name: "Inter-Regiões", path: "/hp/ir" },
  { key: "taca-nacoes", name: "Taça das Nações", path: "/hp/taca-nacoes" },
  { key: "goldencat-m", name: "GoldenCat Masculina", path: "/hp/goldencat-masculina" },
  { key: "goldencat-f", name: "GoldenCat Feminino", path: "/hp/goldencat-feminina" },
  { key: "u23-wse-men", name: "U23 WSE Euro Men", path: "/hp/u23-wse-euro-men" },
  { key: "u19-wse-men", name: "U19 WSE Euro Men", path: "/hp/u19-wse-euro-men" },
  { key: "u17-wse-men", name: "U17 WSE Euro Men", path: "/hp/u17-wse-euro-men" },
  { key: "u17-wse-women", name: "U17 WSE Euro Women", path: "/hp/u17-wse-euro-women" }
];

export const SOURCES = [
  {
    key: "recent",
    name: "Top",
    path: "/",
    genre: "Top"
  },
  {
    key: "live",
    name: "Em Direto",
    path: "/",
    genre: "Live",
    liveOnly: true
  },
  {
    key: "hockey",
    name: "Hoquei em Patins",
    path: "/hp",
    genre: "Hoquei em Patins"
  },
  {
    key: "artistic",
    name: "Patinagem Artistica",
    path: "/pa",
    genre: "Patinagem Artistica"
  },
  {
    key: "speed",
    name: "Patinagem de Velocidade",
    path: "/pv",
    genre: "Patinagem de Velocidade"
  },
  {
    key: "skate",
    name: "Skateboarding",
    path: "/sk",
    genre: "Skateboarding"
  },
  ...HOCKEY_COMPETITIONS.map((competition) => ({
    ...competition,
    genre: `Hoquei em Patins - ${competition.name}`
  }))
];

export const SOURCE_BY_KEY = new Map(SOURCES.map((source) => [source.key, source]));
export const SOURCE_BY_GENRE = new Map(SOURCES.map((source) => [source.genre, source]));
export const CATALOG_GENRES = Array.from(
  new Set(SOURCES.filter((source) => source.key !== "recent").map((source) => source.genre))
);
