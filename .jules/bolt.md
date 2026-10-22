## 2023-10-24 - [NLTK WordNetLemmatizer Performance Bottleneck]
**Learning:** In NLTK NLP preprocessing pipelines, directly calling `WordNetLemmatizer().lemmatize(w)` inside a loop over a large text dataset is highly inefficient. Similarly, running `re.sub()` directly with a raw string pattern forces re-compilation per function call.
**Action:** Always wrap `lemmatize()` calls with `@functools.lru_cache` to cache previous lookups, and always pre-compile regular expressions outside the loop via `re.compile()` to boost text processing speed significantly.
