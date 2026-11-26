# Experimental CV–JD matching

This feature uses one trainable architecture: shared-embedding Siamese BiGRU
with mask-aware attention. The rule-based evidence layer is not a trained model.
The feature is disabled by default. Scores trained on the current synthetic
dataset are **not** hiring probabilities or validated recruitment judgments.

## Data and training

Read [DATASET.md](DATASET.md) before using the training data. The independent
208-case dataset is at `evaluation/synthetic_pairs.jsonl` (SHA-256
`bf961e44a86a61543e12106a34c6c500ed55037baf209060a6c19452b2d03ab3`).
It is never passed to `train.py`.

```bash
python3 -m venv /tmp/cvjd-ml-env
/tmp/cvjd-ml-env/bin/pip install -r ml-service/requirements.txt
mkdir -p /tmp/cvjd-data
curl -fL 'https://huggingface.co/datasets/michaelozon/candidate-matching-synthetic/resolve/178ab864dcad9910c5670d43e4bdbbb901a11f18/resumes/train-00000-of-00001.parquet' -o /tmp/cvjd-data/resumes.parquet
curl -fL 'https://huggingface.co/datasets/michaelozon/candidate-matching-synthetic/resolve/178ab864dcad9910c5670d43e4bdbbb901a11f18/jobs/train-00000-of-00001.parquet' -o /tmp/cvjd-data/jobs.parquet
curl -fL 'https://huggingface.co/datasets/michaelozon/candidate-matching-synthetic/resolve/178ab864dcad9910c5670d43e4bdbbb901a11f18/matches/train-00000-of-00001.parquet' -o /tmp/cvjd-data/matches.parquet
/tmp/cvjd-ml-env/bin/python ml-service/prepare_dataset.py \
  --source-dir /tmp/cvjd-data --output /tmp/cvjd-data/train_pairs.jsonl --max-jobs 1500 --seed 42
OMP_NUM_THREADS=2 TF_NUM_INTEROP_THREADS=2 TF_NUM_INTRAOP_THREADS=2 \
  /tmp/cvjd-ml-env/bin/python ml-service/train.py \
  --data /tmp/cvjd-data/train_pairs.jsonl --license-record ml-service/DATASET.md \
  --output ml-service/artifacts --epochs 5 --cv-length 128 --jd-length 128 \
  --evaluate-test
/tmp/cvjd-ml-env/bin/python ml-service/evaluate_regression.py \
  --dataset ml-service/evaluation/synthetic_pairs.jsonl \
  --artifacts ml-service/artifacts --output ml-service/artifacts/regression_metrics.json
```

The 128/128 length is CPU-bounded. Experimental inference now selects at most
four CV chunks and three JD chunks using section and requirement cues while
preserving leading/trailing context. It reports selected versus total tokens;
text over 30,000 characters is explicitly rejected. `train.py` still rejects
long training pairs rather than silently truncating. Artifacts are excluded
from Git.

At revision `178ab864`, the 4,500-pair run split into 3,150 train, 675
validation and 675 test rows. Positive-class test precision/recall/F1 were
0.554/0.680/0.611. On the separate 208-case regression set, 192 were scored
and 16 long cases were explicitly rejected; accuracy was 0.552 and macro F1
was 0.452 at the predeclared 0.5 decision threshold. On those same 192 cases,
the earlier deterministic skill-overlap and TF-IDF baselines had positive-class
F1 scores 0.744 and 0.720. These are synthetic data results only.

## Optimization experiment (2026-11-26)

The candidate checkpoint is retained separately in ignored `artifacts-v2/`;
the baseline `artifacts/` is unchanged. The training file contains 11,496
synthetic/rule-labeled pairs. Two validation-only trials selected embedding
128, GRU 64, learning rate 0.001, dropout 0.3, batch 32 and class weighting.
Trial A validation macro F1 was 0.844; trial B (embedding 64, GRU 32, learning
rate 0.0005) was 0.839. The three-epoch full-data run reached internal test
macro F1 0.850 and positive F1 0.834, but independent results were weaker.

| Evaluation at fixed 0.5 threshold | Baseline neural macro / positive F1 | Candidate neural macro / positive F1 | Candidate hybrid macro / positive F1 | Literal skill overlap macro / positive F1 | TF-IDF macro / positive F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Locked 300 cases | 0.702 / 0.621 | 0.626 / 0.608 | 0.765 / 0.729 | 0.878 / 0.851 | 0.421 / 0.039 |
| Regression 208 cases | 0.444 / 0.685 | 0.534 / 0.377 | 0.575 / 0.444 | 0.624 / 0.772 | 0.690 / 0.736 |

Both neural checkpoints were scored on exactly the same 300 and 208 cases
with bounded chunk selection. Hybrid scoring combines 70% neural and 30%
explicit required-skill evidence when requirements are available. These
weights and the decision threshold predate this experiment and were not
changed using holdout results. The locked set derives labels from a skill
overlap rule, explaining why direct overlap performs unusually well there.
Scores are not calibrated hiring probabilities. The candidate checkpoint
fails the proposed macro F1 ≥0.75 and positive F1 ≥0.80 gates and is not
promoted. Independent representative data is still required.

The previous neural model clustered most regression scores around 0.5–0.6,
misclassifying 84 of 96 negative cases. The new model reduces those false
positives to zero but misses 86 of 112 positive cases. Its low scores on
short bilingual regression text contrast with the longer source-style CV/JD
pairs used for training. The high internal split score therefore does not
transfer to independently generated phrasing and labels; the source's
skill-overlap labels also differ from the regression set's partial-match
labels. More training on the same synthetic patterns is not a justified fix.

All 208 regression cases were processed, including 16 long cases; mean token
coverage was 95.3%, with some long-document context omitted by the bound.
Neural negation and keyword-stuffing classification was 16/16 each, but only
10/16 long positive cases were classified correctly. English regression macro
F1 was 0.490 and Vietnamese macro F1 was 0.575; the locked set is English
only. Synthetic requirement-status checks were 624/624, which does not
establish accuracy on real CVs. Warm regression p95 was 209 ms; peak
evaluation RSS was about 602 MiB. The offline concurrency benchmark and
predictions are retained in `artifacts-v2/`. HTTP, authorization and cross-user
Redis cache behavior for this checkpoint were not verified because the
feature remains disabled.

Offline model load took 0.35 s and the first inference 0.86 s; steady RSS was
about 521 MiB and peak RSS about 579 MiB in that benchmark. CPU use was
about 132% of one core over 3.81 s. With 16 requests per level, concurrency
1 and 2 completed all requests at 12.11 and 16.09 requests/s (warm p95 86
and 141 ms). At concurrency 4 and 8, the service's
two-slot capacity rule accepted 2/16 and rejected 14/16 immediately at each
level. These are direct-process measurements, not HTTP load-test results.
A separate cold Docker process, including container startup, Python/TensorFlow
imports, model load and one prediction, took 11.71 s on this host.

Reproduce the saved checkpoint from the exact retained training file:

```bash
OMP_NUM_THREADS=2 TF_NUM_INTEROP_THREADS=2 TF_NUM_INTRAOP_THREADS=2 \
  /tmp/cvjd-ml-env/bin/python ml-service/train.py \
  --data ml-service/artifacts-v2/augmented_training_pairs.jsonl \
  --license-record ml-service/DATASET.md --output /tmp/cvjd-reproduced \
  --epochs 3 --cv-length 128 --jd-length 128 --balanced-classes \
  --batch-size 32 --evaluate-test
/tmp/cvjd-ml-env/bin/python ml-service/evaluate_regression.py \
  --dataset ml-service/evaluation/locked_holdout.jsonl \
  --artifacts /tmp/cvjd-reproduced --output /tmp/cvjd-holdout-check.json
/tmp/cvjd-ml-env/bin/python ml-service/evaluate_regression.py \
  --dataset ml-service/evaluation/synthetic_pairs.jsonl \
  --artifacts /tmp/cvjd-reproduced --output /tmp/cvjd-regression-check.json
```

## Private service and feature flag

```bash
docker compose --profile ml up -d --build ml-service
docker compose --profile ml ps
```

The ML service has no published host port. `/health` reports process status;
`/ready` returns 503 without all local artifacts. The frontend and Express
route require `CVJD_MATCHING_ENABLED=true` at Compose startup. Leave it false
until independent validation is acceptable. The ML service additionally
requires independent macro F1 ≥0.70, input coverage ≥95%, and mean neural
scores below 0.5 on negation and keyword-stuffing cases. The current artifact
does not satisfy these gates, so `/ready` remains 503 even if the UI flag is
enabled. These gates control availability; they are not training thresholds.
The Express endpoint is
`POST /api/matches/jobs/:jobId/resumes/:resumeId` for an authenticated Candidate
who owns the CV; it returns 503 when disabled. Redis caching, when available,
uses user ID, job ID, CV ID and content fingerprint with a five-minute TTL.
Set a new `CVJD_MODEL_VERSION` when replacing model artifacts to invalidate
previously cached analyses.

Service output is versioned `experimental-v1`. It distinguishes text evidence
from unverified requirements. Unverified means no evidence in this CV, not
proof that the candidate lacks the skill. Current Job schema has no separate
preferred skills column; this service does not infer one from prose.
