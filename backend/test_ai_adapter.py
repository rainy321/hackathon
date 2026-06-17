# -*- coding: utf-8 -*-
"""Unit tests for ai_adapter.py — config, prompt loading, JSON parsing,
mock functions, and the _run dispatcher."""
import json
from pathlib import Path
from unittest.mock import patch, MagicMock

import ai_adapter


# ---------------------------------------------------------------- config
class TestLoadEnvFile:
    def test_parses_key_value(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text('GLM_API_KEY=abc123\nGLM_MODEL="custom-model"\n')
        with patch.object(ai_adapter, "ENV_FILE", env):
            result = ai_adapter._load_env_file()
        assert result["GLM_API_KEY"] == "abc123"
        assert result["GLM_MODEL"] == "custom-model"

    def test_skips_comments_and_blanks(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("# comment\n\nKEY=val\n")
        with patch.object(ai_adapter, "ENV_FILE", env):
            result = ai_adapter._load_env_file()
        assert "KEY" in result
        assert len(result) == 1

    def test_missing_file_returns_empty(self, tmp_path):
        env = tmp_path / "nonexistent"
        with patch.object(ai_adapter, "ENV_FILE", env):
            assert ai_adapter._load_env_file() == {}


class TestGetConfig:
    def test_defaults(self, tmp_path):
        env = tmp_path / "nonexistent"
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {}, clear=True):
            cfg = ai_adapter.get_config()
        assert cfg["api_key"] == ""
        assert cfg["mock"] is False
        assert cfg["model"] == ai_adapter.DEFAULT_MODEL

    def test_env_var_overrides_file(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("GLM_API_KEY=from_file\n")
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {"GLM_API_KEY": "from_env"}, clear=True):
            cfg = ai_adapter.get_config()
        assert cfg["api_key"] == "from_env"

    def test_mock_flag_truthy(self, tmp_path):
        env = tmp_path / "nonexistent"
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {"AI_MOCK": "1"}, clear=True):
            assert ai_adapter.get_config()["mock"] is True


# ---------------------------------------------------------------- prompt loading
class TestLoadPrompt:
    def test_loads_existing_prompt(self):
        text = ai_adapter.load_prompt("01_goal_decomposer")
        assert len(text) > 0

    def test_missing_prompt_raises(self):
        import pytest
        with pytest.raises(FileNotFoundError):
            ai_adapter.load_prompt("nonexistent_prompt")


# ---------------------------------------------------------------- parse_json_text
class TestParseJsonText:
    def test_plain_json_object(self):
        assert ai_adapter.parse_json_text('{"a": 1}') == {"a": 1}

    def test_plain_json_array(self):
        assert ai_adapter.parse_json_text('[1, 2]') == [1, 2]

    def test_code_fence_json(self):
        text = "```json\n{\"key\": \"val\"}\n```"
        assert ai_adapter.parse_json_text(text) == {"key": "val"}

    def test_surrounding_text(self):
        text = 'Here is the result: {"x": 42} done.'
        assert ai_adapter.parse_json_text(text) == {"x": 42}

    def test_invalid_raises(self):
        import pytest
        with pytest.raises(ValueError):
            ai_adapter.parse_json_text("no json here")


# ---------------------------------------------------------------- mock functions
class TestMockFunctions:
    def test_mock_goal_structure(self):
        out = ai_adapter._mock_goal()
        assert "long_term_skills" in out
        assert "phases" in out
        assert len(out["phases"]) > 0

    def test_mock_planner_structure(self):
        out = ai_adapter._mock_planner()
        assert "tasks" in out
        assert len(out["tasks"]) > 0

    def test_mock_analyst_structure(self):
        out = ai_adapter._mock_analyst()
        assert "insights" in out
        assert len(out["insights"]) > 0

    def test_mock_adjuster_structure(self):
        out = ai_adapter._mock_adjuster()
        assert "adjustments" in out
        adj = out["adjustments"]
        assert "tasks_to_reschedule" in adj
        assert "difficulty_change" in adj


# ---------------------------------------------------------------- _run dispatcher
class TestRun:
    def test_uses_mock_when_no_api_key(self, tmp_path):
        env = tmp_path / "nonexistent"
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {}, clear=True):
            result = ai_adapter.goal_decomposer("test", "1m", "none")
        assert "phases" in result

    def test_uses_mock_when_mock_flag(self, tmp_path):
        env = tmp_path / "nonexistent"
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {"AI_MOCK": "1", "GLM_API_KEY": "fake"}, clear=True):
            result = ai_adapter.daily_planner("g1", "phase", [], "base")
        assert "tasks" in result

    def test_falls_back_to_mock_on_llm_error(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("GLM_API_KEY=fake_key\n")
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {}, clear=True), \
             patch.object(ai_adapter, "call_llm", side_effect=RuntimeError("boom")):
            result = ai_adapter.behavior_analyst([{"date": "2026-01-01", "done": True, "quality": 3, "notes": "ok"}])
        assert "insights" in result

    def test_real_path_parses_llm_output(self, tmp_path):
        env = tmp_path / ".env"
        env.write_text("GLM_API_KEY=fake_key\n")
        fake_response = json.dumps({"adjustments": {"difficulty_change": "none",
                                                     "tasks_to_reschedule": [],
                                                     "focus_strategy": "ok",
                                                     "reason": "fine"}})
        with patch.object(ai_adapter, "ENV_FILE", env), \
             patch.dict("os.environ", {}, clear=True), \
             patch.object(ai_adapter, "call_llm", return_value=fake_response):
            result = ai_adapter.system_adjuster(0.8, [], ["task1"])
        assert result["adjustments"]["difficulty_change"] == "none"


# ---------------------------------------------------------------- public functions
class TestPublicFunctions:
    """Verify each of the 4 prompt functions passes the right input shape to _run."""

    def test_goal_decomposer(self):
        with patch.object(ai_adapter, "_run") as m:
            m.return_value = {"phases": []}
            ai_adapter.goal_decomposer("goal", "1m", "base")
            args = m.call_args
            assert args[0][0] == "01_goal_decomposer"
            inp = args[0][1]
            assert inp["goal"] == "goal"

    def test_daily_planner_with_extra_args(self):
        with patch.object(ai_adapter, "_run") as m:
            m.return_value = {"tasks": []}
            ai_adapter.daily_planner("g1", "phase", [], "base",
                                     goal="My Goal", phase_tasks=["t1"])
            inp = m.call_args[0][1]
            assert inp["goal"] == "My Goal"
            assert inp["phase_tasks"] == ["t1"]

    def test_behavior_analyst(self):
        with patch.object(ai_adapter, "_run") as m:
            m.return_value = {"insights": []}
            ai_adapter.behavior_analyst([{"done": True}])
            inp = m.call_args[0][1]
            assert "logs" in inp

    def test_system_adjuster(self):
        with patch.object(ai_adapter, "_run") as m:
            m.return_value = {"adjustments": {}}
            ai_adapter.system_adjuster(0.5, [{"insight_type": "x", "content": "y"}], ["t1"])
            inp = m.call_args[0][1]
            assert inp["completion_rate_7d"] == 0.5
