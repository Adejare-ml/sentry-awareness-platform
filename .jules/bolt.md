## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-11-07 - [Pandas DataFrame Text Processing Performance Bottleneck]
**Learning:** Using `.apply()` for applying a text preprocessing function over large pandas DataFrames in NLP pipelines is very slow due to pandas Series loop overhead. List comprehensions evaluate much faster by bypassing this overhead.
**Action:** Prefer using list comprehensions (e.g., `[func(text) for text in df['col']]`) over `.apply()` for processing text data in pandas DataFrames to achieve significant performance improvements.
