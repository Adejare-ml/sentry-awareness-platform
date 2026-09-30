## 2025-02-28 - [NLTK Lemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a major performance bottleneck for NLP preprocessing on large datasets in this codebase.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions using `re.compile` to significantly speed up preprocessing pipelines.
