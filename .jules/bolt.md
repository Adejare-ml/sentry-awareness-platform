## 2024-10-13 - [NLTK Lemmatization Optimization]
**Learning:** NLTK's `WordNetLemmatizer` is a significant performance bottleneck for large datasets (e.g., 447k+ rows) because it performs an expensive dictionary lookup for every word during `clean_text` execution.
**Action:** Use `functools.lru_cache` to cache lemmatized words and pre-compile any regular expressions to drastically speed up processing times without changing dependencies.
