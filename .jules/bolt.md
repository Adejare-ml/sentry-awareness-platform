## 2024-10-12 - NLTK WordNetLemmatizer Bottleneck
**Learning:** In this codebase, NLP preprocessing for large datasets relies on NLTK's `WordNetLemmatizer`. Calling `lemmatizer.lemmatize` inside a list comprehension for every word in large datasets (e.g. 447k+ rows) becomes a major performance bottleneck due to redundant calculations.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) when processing text data to achieve significant performance improvements.
