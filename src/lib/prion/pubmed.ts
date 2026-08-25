/**
 * Minimal, dependency-free PubMed E-utilities client.
 *
 * Docs: https://www.ncbi.nlm.nih.gov/books/NBK25500/
 *   esearch → PMIDs for a query
 *   efetch  → full XML records (title, abstract, journal, authors, doi)
 *
 * NCBI usage policy requires tool + email parameters; we also throttle
 * client-side and always send an AbortController-backed timeout.
 */

export interface PubmedPaper {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  pubYear: number | null;
  abstract: string;
  doi: string;
  keywords: string;
}

const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const TOOL = "prnp-variant-analyzer";
const EMAIL = "open.research%40prionanalyzer.dev";

async function fetchWithTimeout(url: string, timeoutMs = 25000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": `${TOOL}/1.0 (open-source research)`, Accept: "*/*" },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`NCBI E-utilities returned HTTP ${res.status}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&#x0?27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export interface PubmedSearchResult {
  ids: string[];
  total: number;
  queryTranslation: string;
}

export async function pubmedSearch(
  term: string,
  retmax: number,
  mindate?: string,
  maxdate?: string,
): Promise<PubmedSearchResult> {
  const params = new URLSearchParams({
    db: "pubmed",
    term,
    retmode: "json",
    retmax: String(retmax),
    sort: "relevance",
    tool: TOOL,
    email: EMAIL,
  });
  if (mindate && maxdate) {
    params.set("mindate", mindate);
    params.set("maxdate", maxdate);
    params.set("datetype", "pdat");
  }

  const xml = await fetchWithTimeout(`${BASE}/esearch.fcgi?${params.toString()}`);
  let json: unknown;
  try {
    json = JSON.parse(xml);
  } catch {
    throw new Error("Invalid JSON returned by esearch (rate limit or network issue).");
  }
  const result = (json as { esearchresult?: Record<string, unknown> }).esearchresult;
  if (!result) throw new Error("Unexpected esearch response shape.");

  const idlist = Array.isArray(result.idlist) ? (result.idlist as string[]) : [];
  const total = Number(result.count ?? idlist.length);
  const queryTranslation =
    typeof result.querytranslation === "string" ? result.querytranslation : "";

  return { ids: idlist, total, queryTranslation };
}

function parseAuthors(block: string): string {
  const names: string[] = [];
  const re = /<Author[\s>][\s\S]*?<\/Author>/g;
  for (const m of block.matchAll(re)) {
    const last = m[0].match(/<LastName>([\s\S]*?)<\/LastName>/);
    const initials = m[0].match(/<Initials>([\s\S]*?)<\/Initials>/);
    const collective = m[0].match(/<CollectiveName>([\s\S]*?)<\/CollectiveName>/);
    if (last && initials) {
      names.push(`${stripTags(last[1])} ${stripTags(initials[1])}`);
    } else if (collective) {
      names.push(stripTags(collective[1]));
    }
    if (names.length >= 6) break;
  }
  return names.join(", ");
}

/** Fetch and parse PubMed records (XML) for a list of PMIDs. */
export async function pubmedFetch(pmids: string[]): Promise<PubmedPaper[]> {
  if (pmids.length === 0) return [];

  const params = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    retmode: "xml",
    rettype: "abstract",
    tool: TOOL,
    email: EMAIL,
  });

  const xml = await fetchWithTimeout(`${BASE}/efetch.fcgi?${params.toString()}`);

  const papers: PubmedPaper[] = [];
  const chunks = xml.split("<PubmedArticle>").slice(1);

  for (const chunk of chunks) {
    const body = chunk.split("</PubmedArticle>")[0];
    if (!body) continue;

    const pmid = body.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1];
    if (!pmid) continue;

    const title = stripTags(body.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? "");
    const journal = stripTags(
      body.match(/<Journal>[\s\S]*?<Title>([\s\S]*?)<\/Title>/)?.[1] ?? "",
    );
    const yearStr =
      body.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ??
      body.match(/<ArticleDate[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ??
      body.match(/<PubDate>[\s\S]*?<MedlineDate>(\d{4})/)?.[1];
    const pubYear = yearStr ? Number(yearStr) : null;

    const abstractParts: string[] = [];
    const abstractRe = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g;
    for (const m of body.matchAll(abstractRe)) {
      abstractParts.push(stripTags(m[1]));
    }
    const abstract = abstractParts.join(" ");

    const authors = parseAuthors(body);
    const doi = body.match(/<ArticleId IdType="doi">([\s\S]*?)<\/ArticleId>/)?.[1] ?? "";

    const keywords: string[] = [];
    const kwRe = /<Keyword[^>]*>([\s\S]*?)<\/Keyword>/g;
    for (const m of body.matchAll(kwRe)) {
      const kw = stripTags(m[1]);
      if (kw) keywords.push(kw);
      if (keywords.length >= 10) break;
    }

    papers.push({
      pmid,
      title,
      authors,
      journal,
      pubYear,
      abstract,
      doi,
      keywords: keywords.join("; "),
    });
  }

  return papers;
}
