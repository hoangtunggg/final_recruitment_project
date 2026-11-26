# Experimental training data

Source: https://huggingface.co/datasets/michaelozon/candidate-matching-synthetic

Pinned revision: `178ab864dcad9910c5670d43e4bdbbb901a11f18`.

The dataset card declares MIT licensing and describes fully synthetic resumes,
jobs and positive match lists generated with Qwen 2.5. It reports 10,000 resumes,
2,500 jobs and 2,500 lists of relevant resumes. The published positives use a
must-have skill overlap rule (60% threshold), not human hiring judgments. The
repository includes source generation notebooks. Use rights follow the published
MIT declaration; upstream generation rights and actual representativeness have
not been independently certified. Data and artifacts must remain experimental.

Downloaded Parquet SHA-256:

- `resumes.parquet`: `4a25add9c3a620c4c396e867063e390fc8084f9b53ed8135def049303a29d7a4`
- `jobs.parquet`: `c13d7c7e0ab510e81117974027de1364f973a27b3cacc8fabfbd8851c352c871`
- `matches.parquet`: `dab24e40948b2da348c6df7072b5b5fe3bb6ef8cab335f88eef5d5667ee79a92`

`prepare_dataset.py --seed 42 --max-jobs 1500` produces 4,500 pairs from
1,500 JDs with unique CV IDs: one published positive, one constructed same-role
negative below the source overlap threshold and one constructed cross-role,
cross-industry zero-overlap negative. No unlisted pair is assumed negative.
The constructed negatives are heuristic labels. Positive and negative rows
sharing a JD stay in one split; CV IDs are unique. The train-only tokenizer
does not see validation or test text. The separate 208-case synthetic regression
dataset is not used for training, thresholds or tuning.

The other two investigated sources were not chosen: `0xnbk/resume-ats-score-v1-en`
derives from another dataset with unresolved upstream resume rights; the
`med2425/resume-job-fit-merged-v1` card does not declare a license and includes
derived or generated sources whose rights need review.

## Optimization dataset and locked holdout

The retained 4,500-pair source file has SHA-256
`bdcfdd182610a65cf7cc4256563d1730d7ea40678e7164caf4c0301f5d9f834c`.
`augment_training.py` adds controlled variants within the same JD groups:
alias/mixed-language positives and explicit negation, keyword-stuffing and
seniority-gap negatives. The resulting 11,496 pairs comprise 4,500 positive
and 6,996 negative labels across 1,500 JDs; SHA-256
`8615f130fea770bb85984646f0b817f41e39cce3d3b7b7749d5407cb3f1830c1`.
These added labels are rules and synthetic perturbations, not verified human
recruitment judgments. Both exact files are retained in ignored
`artifacts-v2/` for local reproduction.

Before the optimization trials, 300 additional source pairs from 100 separate
JDs were fixed in `evaluation/locked_holdout.jsonl` (SHA-256
`a02f0f88c0f87efb7f4897e775df855f040ce04616a5c1f8955be18545b90f04`).
They have no CV or JD group overlap with the augmented training file. Its
labels/results were not inspected for model selection. The 208-case
`synthetic_pairs.jsonl` remains an independent synthetic regression set and
was not used to tune the final checkpoint. Internal train/validation/test
splits retain connected CV/JD groups and train-only tokenizer fitting.

The saved source pair file is needed to reproduce the exact run: an earlier
version of `prepare_dataset.py` iterated an unordered set when choosing positive
CVs. The current preparation code sorts candidates for deterministic future
runs; rerunning preparation may yield a different 4,500-pair file.
