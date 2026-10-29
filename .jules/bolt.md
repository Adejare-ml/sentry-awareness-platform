## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-10-29 - [List Comprehension over .apply() for NLP Pandas Pipelines]
**Learning:** Using `.apply()` for applying text processing functions (like tokenization, stop word removal, and lemmatization) in Pandas DataFrames introduces significant Series loop overhead, which becomes a major bottleneck for large NLP datasets.
**Action:** Always prefer list comprehensions (e.g., `df['col'] = [func(text) for text in df['col']]`) over `.apply()` for text processing operations in this project's NLP pipelines to achieve ~10x performance improvements.
