## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-11-13 - [Pandas Apply vs List Comprehension Performance]
**Learning:** Using `.apply()` on pandas DataFrames for text processing tasks in NLP pipelines introduces significant Series loop overhead, leading to poor performance on large datasets.
**Action:** Prefer using list comprehensions (e.g., `[func(text) for text in df['col']]`) over `.apply()` for pandas DataFrame text processing operations. It yields a significant (~10x) performance improvement.
