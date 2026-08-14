const { useState, useMemo, useRef } = React;

/* ---------- Config ---------- */

const PLATFORMS = {
  instagram: { label: "Instagram", color: "#ef6f61" },
  twitter: { label: "Twitter / X", color: "#4fb3bf" },
  linkedin: { label: "LinkedIn", color: "#9b8cf2" },
  general: { label: "General", color: "#e8a33d" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// deterministic slight tilt per card, so re-renders don't jitter
const tiltFor = (id) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 5) - 2; // -2..2 deg
};

/* ---------- Seed data ---------- */

const today = new Date();
const seedDate = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return toKey(d);
};

let seedId = 0;
const nextId = () => `post-${Date.now()}-${seedId++}`;

const INITIAL_POSTS = [
  { id: nextId(), title: "Product teaser reel", platform: "instagram", date: seedDate(1), time: "10:00" },
  { id: nextId(), title: "Weekly build-in-public thread", platform: "twitter", date: seedDate(1), time: "15:30" },
  { id: nextId(), title: "Hiring: senior designer", platform: "linkedin", date: seedDate(3), time: "09:00" },
  { id: nextId(), title: "Customer story: Studio Nord", platform: "linkedin", date: seedDate(6), time: "11:00" },
  { id: nextId(), title: "Behind-the-scenes carousel", platform: "instagram", date: null, time: "" },
  { id: nextId(), title: "Poll: next feature vote", platform: "twitter", date: null, time: "" },
  { id: nextId(), title: "Newsletter recap", platform: "general", date: null, time: "" },
];

/* ---------- Calendar math ---------- */

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  // trim trailing fully-outside week if entire last row is outside next month AND
  // the month didn't need a 6th row (keeps grid tidy for most months)
  const needsSixRows = cells[35].getMonth() === month || cells[34].getMonth() === month;
  return needsSixRows ? cells : cells.slice(0, 35);
}

/* ---------- Post Card ---------- */

function PostCard({ post, mini, onDragStart, onClick }) {
  const platform = PLATFORMS[post.platform];
  return (
    <div
      className={`post-card${mini ? " mini" : ""}`}
      style={{ "--tag-color": platform.color, "--tilt": `${tiltFor(post.id)}deg` }}
      draggable
      onDragStart={(e) => onDragStart(e, post.id)}
      onClick={() => onClick(post)}
      tabIndex={0}
      role="button"
      aria-label={`${post.title}, ${platform.label}${post.time ? ", " + post.time : ""}`}
    >
      <div className="p-title">{post.title}</div>
      <div className="p-meta">
        <span className="p-platform">{platform.label}</span>
        {post.time && <span>· {post.time}</span>}
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */

function PostModal({ initial, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(initial.title || "");
  const [platform, setPlatform] = useState(initial.platform || "general");
  const [date, setDate] = useState(initial.date || "");
  const [time, setTime] = useState(initial.time || "");
  const isEditing = Boolean(initial.id);

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: initial.id || nextId(),
      title: title.trim(),
      platform,
      date: date || null,
      time,
    });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <h3>{isEditing ? "Edit post" : "New post"}</h3>

        <div className="field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            autoFocus
            placeholder="What are you posting?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Platform</label>
          <div className="platform-pick">
            {Object.entries(PLATFORMS).map(([key, p]) => (
              <button
                type="button"
                key={key}
                className={`platform-chip${platform === key ? " active" : ""}`}
                style={{ "--chip-color": p.color }}
                onClick={() => setPlatform(key)}
              >
                <span className="dot" style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date || ""} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="time">Time</label>
            <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary">Save changes</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
          {isEditing && (
            <button type="button" className="btn btn-danger" onClick={() => onDelete(initial.id)}>
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ---------- App ---------- */

function App() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalState, setModalState] = useState(null); // null | { ...post } | { date }
  const [dragOverKey, setDragOverKey] = useState(null);
  const [queueDragOver, setQueueDragOver] = useState(false);
  const draggedId = useRef(null);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const unscheduled = posts.filter((p) => !p.date);
  const scheduledCount = posts.length - unscheduled.length;

  const postsByDate = useMemo(() => {
    const map = {};
    posts.forEach((p) => {
      if (!p.date) return;
      (map[p.date] = map[p.date] || []).push(p);
    });
    return map;
  }, [posts]);

  const changeMonth = (delta) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const handleDragStart = (e, id) => {
    draggedId.current = id;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const dropOnDay = (e, dateKey) => {
    e.preventDefault();
    setDragOverKey(null);
    const id = draggedId.current || e.dataTransfer.getData("text/plain");
    if (!id) return;
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, date: dateKey } : p)));
    draggedId.current = null;
  };

  const dropOnQueue = (e) => {
    e.preventDefault();
    setQueueDragOver(false);
    const id = draggedId.current || e.dataTransfer.getData("text/plain");
    if (!id) return;
    setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, date: null, time: "" } : p)));
    draggedId.current = null;
  };

  const savePost = (post) => {
    setPosts((ps) => {
      const exists = ps.some((p) => p.id === post.id);
      return exists ? ps.map((p) => (p.id === post.id ? post : p)) : [...ps, post];
    });
    setModalState(null);
  };

  const deletePost = (id) => {
    setPosts((ps) => ps.filter((p) => p.id !== id));
    setModalState(null);
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="eyebrow">Scheduling Studio</span>
          <h1>Post Queue</h1>
          <p>Drag a card onto the calendar to schedule it, or back here to unschedule.</p>
        </div>

        <button className="new-post-btn" onClick={() => setModalState({})}>
          + New post
        </button>

        <div>
          <div className="queue-header">
            <h2>Unscheduled</h2>
            <span>{unscheduled.length}</span>
          </div>
          <div
            className={`queue-list${queueDragOver ? " drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setQueueDragOver(true); }}
            onDragLeave={() => setQueueDragOver(false)}
            onDrop={dropOnQueue}
          >
            {unscheduled.length === 0 ? (
              <div className="queue-empty">Queue is clear — every post has a date.</div>
            ) : (
              unscheduled.map((p) => (
                <PostCard key={p.id} post={p} onDragStart={handleDragStart} onClick={setModalState} />
              ))
            )}
          </div>
        </div>

        <div className="legend">
          {Object.entries(PLATFORMS).map(([key, p]) => (
            <div className="legend-row" key={key}>
              <span className="dot" style={{ background: p.color }} />
              {p.label}
            </div>
          ))}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="month-nav">
            <button className="nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <h2>{monthLabel}</h2>
            <button className="nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
            <button
              className="today-btn"
              onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            >
              Today
            </button>
          </div>
          <div className="stat-strip">
            <span><b>{scheduledCount}</b> scheduled</span>
            <span><b>{unscheduled.length}</b> in queue</span>
          </div>
        </div>

        <div className="weekday-row">
          {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
        </div>

        <div className="calendar-grid">
          {grid.map((d) => {
            const key = toKey(d);
            const outside = d.getMonth() !== cursor.getMonth();
            const isToday = sameDay(d, today);
            const dayPosts = (postsByDate[key] || []).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
            const visible = dayPosts.slice(0, 3);
            const hiddenCount = dayPosts.length - visible.length;

            return (
              <div
                key={key}
                className={`day-cell${outside ? " outside" : ""}${isToday ? " today" : ""}${dragOverKey === key ? " drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(key); }}
                onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
                onDrop={(e) => dropOnDay(e, key)}
              >
                <div className="day-head">
                  <span className="day-num">{d.getDate()}</span>
                  <button
                    className="add-mini"
                    aria-label={`Add post on ${key}`}
                    onClick={() => setModalState({ date: key })}
                  >
                    +
                  </button>
                </div>
                <div className="day-posts">
                  {visible.map((p) => (
                    <PostCard key={p.id} post={p} mini onDragStart={handleDragStart} onClick={setModalState} />
                  ))}
                  {hiddenCount > 0 && <span className="overflow-tag">+{hiddenCount} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {modalState && (
        <PostModal
          initial={modalState}
          onSave={savePost}
          onDelete={deletePost}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
