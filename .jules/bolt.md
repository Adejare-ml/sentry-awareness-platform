## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-11-10 - [Pandas .apply() Overhead in Text Processing]
**Learning:** In Pandas, using `.apply()` on object-dtype columns for string manipulation incurs significant per-element overhead due to type checking and Pandas API wrapping. For simple text processing functions, this is a major performance bottleneck, especially on large datasets.
**Action:** Prefer list comprehensions (e.g., `[func(text) for text in df['col']]`) over `.apply()` for simple function mapping over string columns, as it bypasses Series loop overhead and yields a substantial speedup (often ~10x).
