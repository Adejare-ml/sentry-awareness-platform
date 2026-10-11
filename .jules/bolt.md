## 2024-10-11 - Optimize NLTK WordNetLemmatizer
**Learning:** NLTK's `WordNetLemmatizer.lemmatize` function, when combined with a non-compiled regular expression, becomes a major bottleneck for large datasets like the ones used in SENTRY's fraud/spam NLP models.
**Action:** Always wrap `lemmatize()` with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) during NLP preprocessing steps in Jupyter Notebooks to significantly improve performance on large datasets.
