## 2026-11-02 - [Pandas Text Operations Bottleneck]
**Learning:** Using pandas `.apply()` for complex NLP text processing (like the `clean_text` function in `model_training.ipynb`) introduces massive overhead compared to built-in Python list comprehensions (~10x slower).
**Action:** When performing row-by-row string operations on a pandas DataFrame, especially large text datasets in NLP pipelines, always prefer list comprehensions over `.apply()`.
