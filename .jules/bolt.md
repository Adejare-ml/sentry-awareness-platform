## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2025-03-05 - Avoid `.apply()` for pandas text column operations
**Learning:** Using `pandas.Series.apply()` for text processing introduces significant loop overhead and is considerably slower than simple list comprehensions.
**Action:** When performing row-by-row string operations on a pandas DataFrame column (like NLP cleaning or tokenization), always prefer a list comprehension `[func(text) for text in df['col']]` over `df['col'].apply(func)`. This typically yields a ~10x performance improvement in the NLP pipeline.
