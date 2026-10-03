## 2024-05-19 - NLTK WordNetLemmatizer Bottleneck
**Learning:** NLTK's `WordNetLemmatizer` is a known performance bottleneck when applied to large NLP datasets with a high number of repeated words.
**Action:** Always pre-compile regular expressions using `re.compile` and wrap the `lemmatize()` call with `functools.lru_cache` for NLP preprocessing tasks to avoid redundant computations and drastically improve text cleaning times.
