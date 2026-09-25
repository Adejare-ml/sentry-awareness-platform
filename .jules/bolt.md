## 2026-09-25 - [NLP Preprocessing Performance Bottleneck in NLTK]
**Learning:** NLTK's `WordNetLemmatizer` is a significant performance bottleneck for large datasets in this project. Also, repeated regex matching (e.g. `re.sub(r'[^a-zA-Z\s]', ...)`) on large datasets is expensive.
**Action:** Always pre-compile regular expressions using `re.compile()` and wrap `lemmatize()` calls with `functools.lru_cache` to achieve significant performance improvements in Python NLP preprocessing.
