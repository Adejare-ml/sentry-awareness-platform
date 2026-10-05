## 2024-10-05 - [NLP Preprocessing Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a major bottleneck for large datasets in this project. Redundant lemmatization of common words slows down data pipelines.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) to achieve significant performance improvements for NLP preprocessing tasks.
