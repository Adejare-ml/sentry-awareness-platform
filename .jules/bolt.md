## 2024-10-25 - NLTK WordNetLemmatizer Bottleneck
**Learning:** In NLP pipelines (like in `model_training.ipynb`), repeatedly calling NLTK's `WordNetLemmatizer.lemmatize()` and `re.sub` inside list comprehensions on large datasets causes severe performance bottlenecks due to lack of caching and repeated regex compilation.
**Action:** Always wrap `lemmatize()` calls with `@functools.lru_cache(maxsize=10000)` and pre-compile regular expressions using `re.compile()` outside the processing loop when working with text preprocessing functions like `clean_text`.
