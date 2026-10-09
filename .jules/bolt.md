## 2024-10-09 - NLTK Preprocessing Bottlenecks in Pandas

**Learning:** When preprocessing large text datasets using `pandas.apply()` with NLTK, the `WordNetLemmatizer` operations are incredibly repetitive and slow. Furthermore, creating a new regular expression pattern inside the apply lambda or function (like `re.sub`) for every row causes a massive, unnecessary performance overhead.

**Action:** Always pre-compile `re` patterns globally. More importantly, wrap the `WordNetLemmatizer.lemmatize()` call with `functools.lru_cache(maxsize=50000)` to eliminate redundant NLP calculations on common words (e.g., 'the', 'and', 'bank'). This results in significant speed-ups on large text datasets (e.g., Enron emails).
