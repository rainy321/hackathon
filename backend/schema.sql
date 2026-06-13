-- Growth OS · SQLite 建表(schema 以 docs/数据契约.md 为准)
-- IF NOT EXISTS:便于在已存在的库上安全执行迁移

CREATE TABLE IF NOT EXISTS user (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    baseline TEXT,
    tone     TEXT DEFAULT '温暖朋友',   -- 严格教练 / 温暖朋友 / 幽默伙伴
    password TEXT                        -- salt$sha256,登录用
);

CREATE TABLE IF NOT EXISTS goal (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES user(id),
    title          TEXT NOT NULL,
    category       TEXT,                          -- 学习 / 健康
    time_horizon   TEXT,
    status         TEXT DEFAULT 'active',         -- active / paused / done
    decomposition  TEXT                           -- Goal Decomposer 输出的 JSON
);

CREATE TABLE IF NOT EXISTS task (
    id         TEXT PRIMARY KEY,
    goal_id    TEXT NOT NULL REFERENCES goal(id),
    date       TEXT,                            -- YYYY-MM-DD
    content    TEXT NOT NULL,
    difficulty TEXT,                            -- 低 / 中 / 高
    status     TEXT DEFAULT 'pending'           -- pending / completed / skipped
);

CREATE TABLE IF NOT EXISTS behavior_log (
    id      TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES task(id),
    date    TEXT,                               -- YYYY-MM-DD,灌库时从 task.date 带入
    done    INTEGER DEFAULT 0,                  -- 0 / 1
    quality INTEGER,                            -- 1-5
    notes   TEXT
);

CREATE TABLE IF NOT EXISTS memory (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES user(id),
    insight_type TEXT,
    content      TEXT
);
