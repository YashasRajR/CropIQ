"""
Unit tests for CropIQ Phase 4 Prioritizer, Deduplication, and Conflict Resolution.
"""

import unittest
from src.recommendations.prioritizer import (
    compute_evidence_strength,
    compute_priority_score,
    compute_recommendation_confidence,
    deduplicate_recommendations,
    prioritize_and_rank_recommendations,
    resolve_conflicts,
)
from src.recommendations.utils import RuleTracer


class TestPrioritizer(unittest.TestCase):
    """Test suite for priority scoring, deduplication, and conflict resolution."""

    def setUp(self):
        self.payload_low_risk = {
            "prediction": {"yield": 42.0, "unit": "unconfirmed"},
            "risk": {"score": 20, "level": "LOW"},
            "uncertainty": {"classification": "LOW"},
            "data_quality": {"out_of_distribution": False, "warnings": []},
        }

        self.payload_high_risk = {
            "prediction": {"yield": 28.0, "unit": "unconfirmed"},
            "risk": {"score": 85, "level": "HIGH"},
            "uncertainty": {"classification": "HIGH"},
            "data_quality": {"out_of_distribution": True, "warnings": ["Extrapolation warning"]},
        }

    def test_priority_score_and_levels(self):
        candidate_high = {
            "priority": "HIGH",
            "evidence_strength": "HIGH",
            "actionability": "ACTIONABLE",
        }
        score, level = compute_priority_score(candidate_high, self.payload_high_risk)
        self.assertTrue(0 <= score <= 100)
        self.assertEqual(level, "HIGH")
        self.assertGreaterEqual(score, 70)

        candidate_low = {
            "priority": "LOW",
            "evidence_strength": "LOW",
            "actionability": "INFORMATIONAL",
        }
        score_low, level_low = compute_priority_score(candidate_low, self.payload_low_risk)
        self.assertTrue(0 <= score_low <= 100)
        self.assertEqual(level_low, "LOW")
        self.assertLess(score_low, 40)

    def test_confidence_and_evidence(self):
        candidate = {
            "source_type": "sourced",
            "evidence": [{"type": "negative_model_contribution", "contribution": -1.5}],
        }
        ev_strength = compute_evidence_strength(candidate)
        self.assertEqual(ev_strength, "HIGH")

        # Under low uncertainty & in-distribution
        candidate["evidence_strength"] = ev_strength
        conf_normal = compute_recommendation_confidence(candidate, self.payload_low_risk)
        self.assertEqual(conf_normal, "HIGH")

        # Under high uncertainty / OOD, confidence should be downgraded
        conf_downgraded = compute_recommendation_confidence(candidate, self.payload_high_risk)
        self.assertEqual(conf_downgraded, "MEDIUM")

    def test_conflict_resolution(self):
        tracer = RuleTracer()
        candidates = [
            {"id": "water_001", "category": "WATER", "title": "Review moisture needs"},
            {"id": "water_002", "category": "WATER", "title": "Avoid over-irrigation"},
        ]
        resolved = resolve_conflicts(candidates, tracer=tracer)
        resolved_ids = [c["id"] for c in resolved]

        # water_002 should be suppressed in favor of active moisture deficit water_001
        self.assertIn("water_001", resolved_ids)
        self.assertNotIn("water_002", resolved_ids)

        logs = tracer.get_logs()
        self.assertTrue(any(l["status"] == "CONFLICT_RESOLVED" for l in logs))

    def test_deduplication(self):
        tracer = RuleTracer()
        candidates = [
            {
                "id": "water_001",
                "category": "WATER",
                "priority_score": 80,
                "priority": "HIGH",
                "title": "Water Action 1",
                "reason": "Moisture deficit",
                "action": "Check irrigation",
                "evidence": [{"type": "signal_1"}],
                "limitations": ["Limitation A"],
                "what_if_supported": True,
            },
            {
                "id": "water_003",
                "category": "WATER",
                "priority_score": 85,
                "priority": "HIGH",
                "title": "Water Action Combined",
                "reason": "Combined heat and drought",
                "action": "Check irrigation promptly",
                "evidence": [{"type": "signal_2"}],
                "limitations": ["Limitation B"],
                "what_if_supported": True,
            },
        ]
        deduped = deduplicate_recommendations(candidates, tracer=tracer)
        self.assertEqual(len(deduped), 1)
        merged = deduped[0]
        # Should have highest score
        self.assertEqual(merged["priority_score"], 85)
        # Should have merged evidence items
        self.assertEqual(len(merged["evidence"]), 2)
        # Should have combined limitations
        self.assertIn("Limitation A", merged["limitations"])
        self.assertIn("Limitation B", merged["limitations"])

    def test_top_n_ranking(self):
        candidates = [
            {"id": f"rec_{i}", "category": "GENERAL", "priority": "MEDIUM", "actionability": "MONITOR", "evidence": []}
            for i in range(10)
        ]
        displayed, all_recs = prioritize_and_rank_recommendations(
            candidates=candidates,
            intelligence_payload=self.payload_low_risk,
            top_n=4,
        )
        self.assertEqual(len(displayed), 4)
        self.assertEqual(len(all_recs), 10)


if __name__ == "__main__":
    unittest.main()
