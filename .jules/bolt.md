## 2024-03-12 - [NLP Preprocessing Performance Bottleneck]
**Learning:** In the SENTRY ML training pipeline, NLTK's `WordNetLemmatizer.lemmatize` function is a significant bottleneck when applied to large datasets (e.g. 447k+ Enron emails) due to repeated, redundant processing of the same words.
**Action:** Always wrap `WordNetLemmatizer.lemmatize` with `functools.lru_cache` and pre-compile any regular expressions (using `re.compile`) during NLP preprocessing steps in this project to achieve substantial execution time improvements.
