## 2024-05-24 - NLTK WordNetLemmatizer Bottleneck
**Learning:** In this project, preprocessing large text datasets using NLTK's `WordNetLemmatizer.lemmatize()` inside a loop (like `apply(clean_text)`) is a massive performance bottleneck. The lemmatizer is incredibly slow when called repeatedly on a large corpus like the Enron dataset.
**Action:** Always wrap `lemmatize()` calls with `functools.lru_cache` and pre-compile regular expressions (using `re.compile`) when doing NLP preprocessing in this project to achieve >90x performance improvements.
