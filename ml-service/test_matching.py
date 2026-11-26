import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from server import skill_evidence, classify_skills, experience_evidence, education_evidence, seniority_evidence, project_evidence
from train import grouped_split
from text_chunks import select_sequences
from tensorflow.keras.preprocessing.text import Tokenizer
from model import standardize


class MatchingTests(unittest.TestCase):
    def test_skill_alias_and_negation(self):
        self.assertEqual(skill_evidence("Built APIs in NodeJS", "Node.js")["status"], "matched")
        self.assertEqual(skill_evidence("I have never used React", "React")["status"], "contradicted")
        self.assertEqual(skill_evidence("Chưa từng sử dụng React", "React")["status"], "contradicted")
        self.assertEqual(skill_evidence("Never used or practiced: React, SQL", "SQL")["status"], "contradicted")
        self.assertEqual(skill_evidence("Copied job keywords, no hands-on experience: React", "React")["status"], "unverified")
        self.assertEqual(skill_evidence("Currently learning React", "React")["status"], "partial")
        self.assertEqual(skill_evidence("Skills: React\nI have never used React", "React")["status"], "unverified")
        self.assertEqual(skill_evidence("No mention of React here", "Python")["status"], "unverified")

    def test_group_split_has_no_shared_cv_or_jd(self):
        rows = [{"cv_group": f"cv-{i}-{j}", "jd_group": f"jd-{i}", "label": j % 2}
                for i in range(20) for j in range(3)]
        splits = grouped_split(rows, 42)
        for key in ("cv_group", "jd_group"):
            sets = [{r[key] for r in part} for part in splits]
            self.assertFalse(sets[0] & sets[1] or sets[0] & sets[2] or sets[1] & sets[2])

    def test_explicit_requirements_only(self):
        jd = {"skills": "React, TypeScript, Figma", "requirements": "Thành thạo React, TypeScript; Ưu tiên Figma", "education": "BSc"}
        self.assertEqual(classify_skills(jd), (["React", "TypeScript"], ["Figma"], []))
        self.assertEqual(education_evidence("BSc Computer Science", jd)["status"], "matched")
        self.assertEqual(experience_evidence("3 năm kinh nghiệm", {"requirements": "Từ 4 năm kinh nghiệm"})["status"], "partial")
        self.assertEqual(seniority_evidence("Junior developer", {"experience":"Senior Level"})["status"], "partial")
        self.assertEqual(project_evidence("Project: frontend dashboard", {"title":"Frontend Engineer"})["status"], "partial")

    def test_long_document_selection_is_bounded_and_reports_omissions(self):
        text = ("Background context. " * 400) + "\nSkills: React.\nProject: React dashboard."
        tokenizer = Tokenizer(oov_token="<OOV>", filters="")
        tokenizer.fit_on_texts([standardize([text]).numpy()[0].decode()])
        chunks, coverage = select_sequences(text, tokenizer, 128, max_chunks=4, priority_terms=["React"])
        self.assertTrue(1 <= len(chunks) <= 4)
        self.assertTrue(all(len(chunk) <= 128 for chunk in chunks))
        self.assertLess(coverage["selectedTokens"], coverage["totalTokens"])
        self.assertIn(tokenizer.word_index["react"], chunks[-1])


if __name__ == "__main__":
    unittest.main()
