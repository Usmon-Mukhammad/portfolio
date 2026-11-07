---
title: Example AI post — formatting reference
description: A draft that shows every element the blog supports. It is never published; delete or replace it once the first real post exists.
date: 2026-11-10
series: ai
tags: [Example, Formatting]
draft: true
---

This draft is a **formatting reference**. It only appears while running `npm run dev`.

## Headings and text

Paragraphs, *emphasis*, **bold**, `inline code` and [links](https://ameer.uz/) all work.

> A blockquote, for a key idea worth pulling out.

## Code

```python
import numpy as np

def softmax(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    z = logits / temperature
    z = z - z.max()
    p = np.exp(z)
    return p / p.sum()

print(softmax(np.array([2.0, 1.0, 0.1])))
```

## Lists and tables

1. Tokenize the prompt
2. Run the model to get logits
3. Sample the next token

| Approach | When to use |
|---|---|
| Prompting | Behaviour can be described in words |
| RAG | Answers depend on your documents |
| Fine-tuning | Style or format must be learned |

## Maths

The probability of the next token is $p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$.
