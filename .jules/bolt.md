## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2024-11-07 - Python String Processing Optimization in Pandas
**Learning:** In the NLP preprocessing pipelines, applying text normalization functions (like `clean_text`) via `pandas.Series.apply()` introduces significant Series loop overhead, creating a severe bottleneck for large datasets (e.g. 447k rows taking 5-10 minutes).
**Action:** Always prefer list comprehensions (e.g., `[func(text) for text in df['col']]`) over `.apply()` for pandas DataFrame text processing operations. This yields approximately a 10x performance improvement by bypassing pandas object overhead.
