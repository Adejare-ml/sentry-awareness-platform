## 2024-05-18 - Optimized NLTK Lemmatizer in Jupyter Notebook
**Learning:** NLTK's `WordNetLemmatizer` is a known bottleneck for large datasets (447k+ rows). Additionally, dynamically compiling regexes via `re.sub` within a loop creates significant overhead.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) to achieve significant performance improvements, particularly in NLP tasks across this project.
