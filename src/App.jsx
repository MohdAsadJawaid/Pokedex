import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 20;

async function fetchPage(pageIndex = 0) {
  const offset = pageIndex * PAGE_SIZE;
  const res = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`
  );
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  // return results with page index
  return { ...data, page: pageIndex };
}

function shortId(url) {
  return url.split("/").filter(Boolean).pop();
}

function PokemonCard({ p, onOpen, isFav, toggleFav }) {
  const id = shortId(p.url);
  const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen(p);
      }}
      className={`group bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-2xl p-3 flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md border`}
    >
      <img src={sprite} alt={p.name} className="w-16 h-16 object-contain" />
      <div className="text-left flex-1">
        <div className="font-semibold capitalize">{p.name}</div>
        <div className="text-xs text-slate-500">#{id.padStart(3, "0")}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(p);
          }}
          aria-label="toggle-fav"
          className="p-1"
        >
          {isFav ? "💖" : "🤍"}
        </button>
        <div className="text-xs text-slate-400 group-hover:text-slate-600">
          Details →
        </div>
      </div>
    </div>
  );
}

async function fetchPokemonDetails(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch details");
  return res.json();
}

function DetailModal({ pokemon, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pokemon) return;
    setLoading(true);
    fetchPokemonDetails(pokemon.url)
      .then((d) => setDetails(d))
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [pokemon]);

  return (
    <AnimatePresence>
      {pokemon && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 50, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 50, scale: 0.98 }}
            className="w-full md:w-3/4 lg:w-1/2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border p-6 overflow-auto max-h-[85vh]"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4 items-center">
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${shortId(
                    pokemon.url
                  )}.png`}
                  alt={pokemon.name}
                  className="w-28 h-28 object-contain"
                />
                <div>
                  <h2 className="text-2xl font-bold capitalize">
                    {pokemon.name}
                  </h2>
                  <div className="text-sm text-slate-500">
                    #{shortId(pokemon.url).padStart(3, "0")}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {details?.types?.map((t) => (
                      <span
                        key={t.type.name}
                        className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs capitalize"
                      >
                        {t.type.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1 rounded-md border"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Stats</h3>
                {loading ? (
                  <p className="text-sm text-slate-500">Loading stats…</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {details?.stats?.map((s) => (
                      <li key={s.stat.name} className="flex justify-between">
                        <span className="capitalize">
                          {s.stat.name.replace("-", " ")}
                        </span>
                        <span className="font-semibold">{s.base_stat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-semibold">Moves (first 8)</h3>
                {loading ? (
                  <p className="text-sm text-slate-500">Loading moves…</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {details?.moves?.slice(0, 8).map((m) => (
                      <span
                        key={m.move.name}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs capitalize"
                      >
                        {m.move.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="font-semibold">Height / Weight</h3>
                  {!loading && details && (
                    <div className="text-sm text-slate-600 mt-1">
                      {details.height / 10} m · {details.weight / 10} kg
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return <MainApp />;
}

function MainApp() {
  const [pages, setPages] = useState([]); // array of page responses
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("id");
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pokedex:favs") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("pokedex:favs", JSON.stringify(favorites));
  }, [favorites]);

  const loadMoreRef = useRef(null);
  const fetchingRef = useRef(false);

  // load initial page
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchPage(0)
      .then((res) => {
        if (!mounted) return;
        setPages([res]);
        setHasNextPage(Boolean(res.next));
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setIsError(true);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchNextPage = async () => {
    if (fetchingRef.current || !hasNextPage) return;
    fetchingRef.current = true;
    setIsFetchingNextPage(true);
    const nextPageIndex = pages.length;
    try {
      const res = await fetchPage(nextPageIndex);
      setPages((prev) => [...prev, res]);
      setHasNextPage(Boolean(res.next));
    } catch (e) {
      setIsError(true);
    }
    setIsFetchingNextPage(false);
    fetchingRef.current = false;
  };

  // intersection observer for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => {
      try {
        obs.unobserve(el);
      } catch {}
      try {
        obs.disconnect();
      } catch {}
    };
  }, [hasNextPage, pages.length]);

  const allPokemons = useMemo(() => {
    return pages.flatMap((p) => p.results || []);
  }, [pages]);

  // local search + filter
  const visible = useMemo(() => {
    let arr = [...allPokemons];
    if (query) arr = arr.filter((x) => x.name.includes(query.toLowerCase()));
    if (filterType !== "all") {
      arr = arr.filter((p) => {
        const saved = localStorage.getItem(`pokedex:type:${shortId(p.url)}`);
        if (!saved) return true; // show until type resolved
        try {
          const types = JSON.parse(saved);
          return types.includes(filterType);
        } catch {
          return true;
        }
      });
    }
    if (sortBy === "name")
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr.sort((a, b) => +shortId(a.url) - +shortId(b.url));
  }, [allPokemons, query, filterType, sortBy]);

  // prefetch types for first N entries to make filter feel snappy
  useEffect(() => {
    const toPrefetch = allPokemons.slice(0, 60);
    toPrefetch.forEach((p) => {
      const key = `pokedex:type:${shortId(p.url)}`;
      if (localStorage.getItem(key)) return;
      fetchPokemonDetails(p.url)
        .then((d) => {
          const types = d.types.map((t) => t.type.name);
          localStorage.setItem(key, JSON.stringify(types));
        })
        .catch(() => {});
    });
  }, []);

  function toggleFav(p) {
    setFavorites((prev) => {
      const id = shortId(p.url);
      if (prev.find((x) => x.id === id)) return prev.filter((x) => x.id !== id);
      return [{ id, name: p.name, url: p.url }, ...prev];
    });
  }

  async function openDetails(p) {
    setSelected(p);
    // optimistic prefetch
    fetchPokemonDetails(p.url)
      .then((d) => {
        try {
          localStorage.setItem(
            `pokedex:details:${shortId(p.url)}`,
            JSON.stringify(d)
          );
        } catch {}
      })
      .catch(() => {});
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold">
              Poke<span className="text-sky-500">Dex</span>
            </h1>
            <p className="text-sm text-slate-500">
              Browse our curated collection of fan-favorite Pokémon.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full justify-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Name"
              tabIndex={0}
              className="flex-1 px-3 py-2 rounded-lg border focus:ring focus:ring-sky-200"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 rounded border border-gray-500 bg-transparent  text-gray-800 dark:text-white 
             dark:border-gray-500"
            >
              <option value="all">All types</option>
              <option value="grass">Grass</option>
              <option value="fire">Fire</option>
              <option value="water">Water</option>
              <option value="electric">Electric</option>
              <option value="psychic">Psychic</option>
              <option value="ice">Ice</option>
              <option value="dragon">Dragon</option>
              <option value="dark">Dark</option>
              <option value="fairy">Fairy</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 rounded border border-gray-500 bg-transparent  text-gray-800 dark:text-white 
             dark:border-gray-500"
            >
              <option value="id">Sort: ID</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        </header>

        <main>
          <section className="mim-w-sm w-full bg-gray-800 rounded-lg shadow-lg p-4  items-center mx-auto">
            {visible.map((p) => (
              <PokemonCard
                key={p.url}
                p={p}
                onOpen={openDetails}
                isFav={!!favorites.find((f) => f.id === shortId(p.url))}
                toggleFav={toggleFav}
              />
            ))}
          </section>

          <div className="mt-4 flex justify-center">
            {isLoading && (
              <div className="text-slate-500">Loading pokemons…</div>
            )}
            {isError && <div className="text-red-500">Failed to load.</div>}
          </div>

          <div ref={loadMoreRef} className="mt-6 flex justify-center">
            {isFetchingNextPage ? (
              <div className="text-slate-500">Loading more…</div>
            ) : hasNextPage ? (
              <div className="text-slate-400 text-sm">
                Scroll down to load more
              </div>
            ) : (
              <div className="text-slate-400 text-sm">No more pokemons</div>
            )}
          </div>
        </main>

        <aside className="mt-8">
          <h3 className="font-semibold">Favorites</h3>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {favorites.length === 0 ? (
              <div className="text-sm text-slate-500">
                No favorites yet — tap the heart on a card.
              </div>
            ) : (
              favorites.map((f) => (
                <div
                  key={f.id}
                  className="min-w-[120px] p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg border flex items-center gap-2"
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${f.id}.png`}
                    className="w-10 h-10"
                  />
                  <div className="text-sm capitalize">{f.name}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <DetailModal pokemon={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
