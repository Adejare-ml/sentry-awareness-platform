## 2025-02-18 - [NLTK Lemmatizer Performance Anti-Pattern]
**Learning:** Calling NLTK's `WordNetLemmatizer` without caching within a loop or pandas `apply` on a large dataset (e.g. 447k rows) creates a massive performance bottleneck due to repeated lookups for the same words. Uncompiled regexes in the same loop add overhead.
**Action:** Always wrap the `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) when performing large-scale NLP preprocessing in this project.
