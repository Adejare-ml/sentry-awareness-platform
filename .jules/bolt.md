## 2024-10-04 - Optimize NLP text cleaning in Notebook
**Learning:** NLTK's `WordNetLemmatizer` is a significant bottleneck when applied to large datasets (like 447k+ rows). Additionally, re-compiling regular expressions inside a frequently called function (`apply`) wastes time.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) globally or outside the execution loop to achieve massive performance improvements.
