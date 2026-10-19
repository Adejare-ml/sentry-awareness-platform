## 2025-02-26 - [Pre-compiling regex and caching NLTK Lemmatizer calls]
**Learning:** In text preprocessing tasks involving large datasets, repeatedly compiling regular expressions or invoking the `WordNetLemmatizer` via NLTK (which is used here for preprocessing) can be computationally expensive and time-consuming since it runs row by row.
**Action:** When using NLP libraries like NLTK in a dataset mapping function (like `df.apply`), use `functools.lru_cache` on the lemmatization step and pre-compile regular expressions using `re.compile`.
