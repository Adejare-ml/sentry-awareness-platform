## 2024-05-24 - [NLP Preprocessing Performance Bottleneck]
**Learning:** In text-heavy ML pipelines (like SENTRY's Fraud Detector), `nltk.stem.WordNetLemmatizer.lemmatize` becomes a major bottleneck when applied row-by-row on large datasets (400k+ rows). Regex pattern matching `re.sub` inside the loop also adds significant overhead.
**Action:** Always pre-compile regexes and wrap `lemmatize` with `functools.lru_cache` (since natural language has a Zipfian distribution, many words repeat, making caching highly effective).
