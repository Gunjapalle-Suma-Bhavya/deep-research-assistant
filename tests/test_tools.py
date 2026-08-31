"""Unit tests for Search and Summarization tools."""

import unittest
from deep_research.tools import duckduckgo_search_sync, SearchResult, get_search_tool
from deep_research.state import ClarifyWithUser, ResearchQuestion, ResearchNote


class TestToolsAndState(unittest.TestCase):
    """Test suite for research tools and state schemas."""

    def test_duckduckgo_search_returns_list(self):
        """Verify DuckDuckGo search fallback handles queries gracefully."""
        results = duckduckgo_search_sync("Python LangGraph", max_results=2)
        self.assertIsInstance(results, list)
        if results:
            self.assertIsInstance(results[0], SearchResult)
            self.assertTrue(results[0].title)
            self.assertTrue(results[0].url)

    def test_state_models(self):
        """Verify state schemas validation."""
        clarif = ClarifyWithUser(
            needs_clarification=True,
            clarification_questions=["What is the target depth?", "Which focus area?"],
            reasoning="Query was too brief."
        )
        self.assertTrue(clarif.needs_clarification)
        self.assertEqual(len(clarif.clarification_questions), 2)

        brief = ResearchQuestion(
            title="AI Evaluation Study",
            core_question="How to evaluate agents reliably?",
            sub_topics=["Unit Testing", "Trajectory Evals", "LLM Judges"],
            search_queries=["agent eval benchmark"],
        )
        self.assertEqual(len(brief.sub_topics), 3)
        self.assertEqual(brief.target_depth, "comprehensive")


if __name__ == "__main__":
    unittest.main()

