"""Bounded, section-aware selection using the same tokenizer as training."""
import re

from model import standardize

IMPORTANT = re.compile(r"\b(?:skills?|required|preferred|experience|education|degree|projects?|kỹ năng|bắt buộc|ưu tiên|kinh nghiệm|học vấn|bằng cấp|dự án)\b", re.I)


def select_sequences(text, tokenizer, length, max_chunks=1, priority_terms=()):
    if len(text) > 30000:
        raise ValueError("Text exceeds the 30,000-character processing limit")
    full = tokenizer.texts_to_sequences([standardize([text]).numpy()[0].decode()])[0]
    if len(full) <= length:
        return [full], {"totalTokens":len(full), "selectedTokens":len(full), "chunks":1}
    sections = [part.strip() for part in re.split(r"\n+|(?<=[.!?])\s+", text) if part.strip()]
    if not sections:
        return [[]], {"totalTokens":0, "selectedTokens":0, "chunks":1}
    cleaned = [part.decode() for part in standardize(sections).numpy()]
    encoded = tokenizer.texts_to_sequences(cleaned)
    items = []
    for index, (raw, seq) in enumerate(zip(sections, encoded)):
        if not seq:
            continue
        salience = len(IMPORTANT.findall(raw)) * 4
        salience += sum(bool(re.search(r"(?<!\w)" + re.escape(term) + r"(?!\w)", raw, re.I))
                        for term in priority_terms if term)
        for offset in range(0, len(seq), length):
            items.append((salience, index, offset, seq[offset:offset+length]))
    if not items:
        return [[]], {"totalTokens":0, "selectedTokens":0, "chunks":1}
    # Preserve one leading and one trailing chunk when possible; rank the
    # remaining budget by section salience. Selected order stays document order.
    mandatory = {0, len(items)-1} if max_chunks > 1 else set()
    ranked = sorted(range(len(items)), key=lambda i:(-items[i][0], -items[i][1], i))
    chosen = set(mandatory)
    selected_tokens = sum(len(items[i][3]) for i in chosen)
    for i in ranked:
        if selected_tokens >= max_chunks * length:
            break
        if i not in chosen:
            chosen.add(i)
            selected_tokens += len(items[i][3])
    chunks = []
    scores = []
    for i in sorted(chosen):
        seq = items[i][3]
        if not chunks or len(chunks[-1]) + len(seq) > length:
            chunks.append([])
            scores.append(0)
        chunks[-1].extend(seq)
        scores[-1] += items[i][0]
    if len(chunks) > max_chunks:
        keep = {0, len(chunks)-1} if max_chunks > 1 else set()
        for i in sorted(range(len(chunks)), key=lambda j:-scores[j]):
            if len(keep) >= max_chunks:
                break
            keep.add(i)
        chunks = [chunks[i] for i in sorted(keep)]
    return chunks, {"totalTokens":sum(len(item[3]) for item in items),
                    "selectedTokens":sum(len(chunk) for chunk in chunks), "chunks":len(chunks)}
