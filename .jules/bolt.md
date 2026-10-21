## 2023-10-21 - [Performance] Bottleneck in NLP Preprocessing Pipeline
**Learning:** In the SENTRY v2.0 NLP tasks, NLTK's `WordNetLemmatizer` is a significant performance bottleneck when processing large datasets sequentially. This occurs because the lemmatizer does repeated lookups for the same words across thousands of rows.
**Action:** Always wrap NLTK `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) to drastically reduce text cleaning execution time.
