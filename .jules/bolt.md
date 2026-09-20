## 2024-03-24 - Pre-compiling Regex and LRU Caching NLTK Lemmatizer
**Learning:** In text preprocessing tasks involving large datasets (e.g., 400k+ rows in Enron dataset), repetitive calls to `re.sub` and `lemmatizer.lemmatize()` from NLTK create a significant performance bottleneck due to regex compilation overhead and dictionary lookups respectively.
**Action:** Always pre-compile regular expressions using `re.compile()` and memoize the lemmatizer using `@functools.lru_cache` when applying preprocessing functions across large pandas DataFrames.
