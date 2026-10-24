## 2024-05-24 - NLP Preprocessing Optimization
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this project.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) to achieve significant performance improvements.
