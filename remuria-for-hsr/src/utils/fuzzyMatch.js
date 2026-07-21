// Fuzzy subsequence match — every character of `query`, in order, must appear
// somewhere in `candidate` (not necessarily contiguous), e.g. "fre" matches
// "Fire". Originally lived only in DashboardsRelics.jsx's set/relic-name
// autocomplete; extracted here so the builds tab's path/element autocomplete
// can share the exact same matching behaviour instead of a second copy.
export function subsequenceMatch(query, candidate) {
  const q = query.toLowerCase(), c = candidate.toLowerCase();
  let qi = 0;
  for (let ci = 0; ci < c.length && qi < q.length; ci++)
    if (c[ci] === q[qi]) qi++;
  return qi === q.length;
}
