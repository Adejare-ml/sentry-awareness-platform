## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2025-02-12 - [Pandas Text Processing Performance Bottleneck]
**Learning:** For pandas DataFrame text processing operations in this project's NLP pipelines, using `.apply()` yields a significant performance overhead because of Series loop execution.
**Action:** Always prefer using list comprehensions (e.g., `[func(text) for text in df['col']]`) over `.apply()` as it yields a significant (~10x) performance improvement by avoiding Series loop overhead.
