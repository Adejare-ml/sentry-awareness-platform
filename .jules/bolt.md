## 2025-10-15 - NLTK Lemmatizer Performance Bottleneck
**Learning:** NLTK's `WordNetLemmatizer` is a major performance bottleneck for NLP preprocessing loops on large datasets (like `df['Body'].apply(clean_text)` in pandas), especially when paired with repeated regex compilation.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions using `re.compile` before the apply loop. This caches repetitive operations and skips redundant computations for common words.
