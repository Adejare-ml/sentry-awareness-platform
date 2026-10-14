## 2024-10-14 - Optimize NLTK Lemmatization and Regex Pre-compilation
**Learning:** In this codebase's NLP pipeline, using NLTK's `WordNetLemmatizer` directly in a pandas `apply` loop for large datasets (e.g., 447k+ rows) acts as a significant performance bottleneck. Additionally, dynamically compiling regular expressions within the loop adds unnecessary overhead.
**Action:** Always wrap NLTK `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) prior to execution over large datasets to drastically improve text processing speed.
