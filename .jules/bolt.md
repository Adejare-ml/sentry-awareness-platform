## 2024-05-23 - NLTK WordNetLemmatizer caching
**Learning:** NLTK's `WordNetLemmatizer.lemmatize()` is extremely slow on large datasets because it operates independently on every word without memoization.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache(maxsize=...)` and ensure regular expressions are pre-compiled with `re.compile()` outside the processing loop.

## 2024-05-24 - Pandas apply vs list comprehension performance in NLP
**Learning:** For NLP preprocessing using NLTK in pandas DataFrames (like `.apply(clean_text)`), pandas Series loop overhead creates a significant performance bottleneck.
**Action:** Always prefer using Python list comprehensions (e.g., `[clean_text(text) for text in df['col']]`) over `.apply()` for large text processing datasets. It yields roughly a ~10x performance improvement.
