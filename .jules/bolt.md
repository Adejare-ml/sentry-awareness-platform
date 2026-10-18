## 2023-10-27 - [NLTK Lemmatizer Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a known performance bottleneck for large NLP datasets. It takes a significant amount of time to lemmatize individual words in large DataFrames.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) when doing text preprocessing on large datasets.
