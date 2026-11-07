---
title: Example quantum post — maths reference
description: A draft that shows quantum notation in KaTeX. It is never published; delete or replace it once the first real post exists.
date: 2026-11-13
series: quantum
tags: [Example, Maths]
draft: true
---

This draft shows how quantum notation renders. It only appears while running `npm run dev`.

## A qubit

A qubit is a superposition $\ket{\psi} = \alpha\ket{0} + \beta\ket{1}$ with $|\alpha|^2 + |\beta|^2 = 1$.

## Gates as matrices

$$
H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix},
\qquad
H\ket{0} = \frac{\ket{0} + \ket{1}}{\sqrt{2}}
$$

## A Bell state

$$
\ket{\Phi^+} = \frac{1}{\sqrt{2}}\left(\ket{00} + \ket{11}\right)
$$

```python
import cirq

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit(cirq.H(q0), cirq.CNOT(q0, q1), cirq.measure(q0, q1))
print(circuit)
```
