## 2024-03-24 - [NLP Preprocessing Bottleneck]
**Learning:** NLTK's `WordNetLemmatizer` is a significant performance bottleneck when processing large datasets like the Enron email corpus.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions using `re.compile` to significantly speed up data preprocessing in ML pipelines.
