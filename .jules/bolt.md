## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-10-27 - [Pandas .apply() Overhead in Text Processing]
**Learning:** In pandas, `.apply()` on a Series is essentially a Python loop with significant overhead under the hood. Using a list comprehension for string operations bypasses the Series overhead and operates much closer to C/CPython speeds, which yields a ~10x speedup for text-heavy DataFrame processing like in NLP pipelines.
**Action:** Prefer list comprehensions (e.g., `[clean_text(text) for text in df['Body']]`) over pandas `.apply()` when processing large text columns in DataFrames.
