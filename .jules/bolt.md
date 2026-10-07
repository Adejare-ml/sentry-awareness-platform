## 2023-10-07 - Optimize NLTK Lemmatization in pandas apply
**Learning:** NLTK's `WordNetLemmatizer` when used within a pandas `apply` function for NLP preprocessing over large datasets (like 447k+ rows) acts as a significant performance bottleneck due to redundant operations on repeated words and regex compilation inside the loop.
**Action:** Use Python's `functools.lru_cache` to memoize the lemmatizer output and pre-compile regular expressions using `re.compile` outside the text cleaning function. This drastically reduces the redundant processing time for repetitive text datasets.
