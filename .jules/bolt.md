## 2023-10-25 - [Bottleneck: NLTK WordNetLemmatizer inside Pandas apply]
**Learning:** NLTK's `WordNetLemmatizer.lemmatize()` is extremely slow when applied per-word across large pandas dataframes using `.apply()`. Standard inline regex compilation inside the loop also adds unnecessary overhead.
**Action:** Always wrap NLTK lemmatization calls with `functools.lru_cache` and pre-compile regular expressions using `re.compile()` outside the row-processing function for massive performance gains in NLP preprocessing pipelines.
