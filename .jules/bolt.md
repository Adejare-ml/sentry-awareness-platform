## 2025-02-18 - Optimize NLTK WordNetLemmatizer
**Learning:** NLTK's `WordNetLemmatizer` is a major bottleneck for large datasets during NLP preprocessing. The default `lemmatize()` implementation recalculates the same morphological transformations for frequent words.
**Action:** Always wrap `lemmatizer.lemmatize` in `functools.lru_cache` and pre-compile regular expressions (with `re.compile`) when preprocessing large text datasets to drastically speed up execution time.
