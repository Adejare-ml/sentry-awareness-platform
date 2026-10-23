
## 2025-02-18 - Optimized NLTK Lemmatization in model_training.ipynb
**Learning:** Found that NLTK's `WordNetLemmatizer` is a severe bottleneck for large datasets in this NLP pipeline. Wrapping its `lemmatize()` function with `functools.lru_cache` and pre-compiling the `re.compile()` logic significantly improves row processing time.
**Action:** Always employ `lru_cache` for NLTK lemmatization and pre-compile regular expressions in text preprocessing loops within this codebase.
