## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-11-06 - [Pandas .apply() vs List Comprehensions]
**Learning:** In Pandas DataFrame text processing operations, `.apply()` is significantly slower than using list comprehensions due to Series iteration and function calling overhead, especially on large datasets.
**Action:** Prefer using list comprehensions (e.g., `[func(text) for text in df['col']]`) over `.apply()` as it yields a significant (~10x) performance improvement by avoiding Series loop overhead. Always document expected improvements in the code as comments when making this optimization.
