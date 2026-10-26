## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.
