## 2023-10-25 - [NLTK WordNetLemmatizer Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a severe performance bottleneck for large datasets (like the 447k+ rows Enron dataset). Applying it iteratively per row without caching results in redundant computation, and using `re.compile` inside a loop further impacts performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) prior to NLP preprocessing loops to achieve significant performance improvements.
