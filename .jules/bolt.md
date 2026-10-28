## 2023-10-26 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets in this NLP preprocessing pipeline. Repeatedly compiling regular expressions inside a text cleaning function applied over large pandas DataFrames also significantly degrades performance.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) outside the function scope to achieve significant performance improvements without sacrificing code readability.

## 2023-10-28 - [Pandas DataFrame `.apply()` Loop Overhead Bottleneck]
**Learning:** For element-wise text processing in large pandas DataFrames (like the `enron_data_fraud_labeled.csv` processing here), using `.apply()` essentially forces a Python `for` loop with significant internal pandas overhead (type checking, indexing). This is a major bottleneck on datasets with hundreds of thousands of rows.
**Action:** Replace `df['col'].apply(func)` with list comprehensions like `[func(val) for val in df['col']]` when the function operates purely element-wise and doesn't require Series alignment. This routinely yields ~10x speedups by avoiding pandas overhead entirely while perfectly preserving positional order.
