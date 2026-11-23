
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

function App() {
  const [page, setPage] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userMessage, setUserMessage] = useState("");

  // Notes states
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Search and pinned notes (saved separately for each logged-in account)
  const [searchTerm, setSearchTerm] = useState("");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");

  // Get the latest notes from the backend
  const fetchNotes = async (showRefreshMessage = false) => {
    if (!token) {
      setNoteMessage("Please log in again to refresh your notes.");
      return;
    }

    if (showRefreshMessage) setRefreshing(true);

    try {
      const response = await axios.get(`${API}/notes/`, {
        headers: { Authorization: token }
      });

      const latestNotes = Array.isArray(response.data?.notes)
        ? response.data.notes
        : [];
      setNotes(latestNotes);
      if (showRefreshMessage) setNoteMessage("Notes refreshed successfully!");
    } catch (error) {
      console.error("Refresh notes error:", error);
      setNoteMessage(
        error.response?.data?.msg ||
        `Unable to refresh notes (${error.response?.status || "network error"}).`
      );
    } finally {
      if (showRefreshMessage) setRefreshing(false);
    }
  };

  // Load saved pinned-note IDs for the current account
  useEffect(() => {
    if (!token) {
      setPinnedNotes([]);
      return;
    }

    try {
      const savedPins = JSON.parse(
        localStorage.getItem(`notenest-pinned-${token}`) || "[]"
      );
      setPinnedNotes(Array.isArray(savedPins) ? savedPins : []);
    } catch {
      setPinnedNotes([]);
    }
  }, [token]);

  const togglePin = (noteId) => {
    const id = String(noteId);
    setPinnedNotes((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      localStorage.setItem(`notenest-pinned-${token}`, JSON.stringify(next));
      return next;
    });
  };

  const filteredNotes = notes
    .filter((note) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        note.title?.toLowerCase().includes(query) ||
        note.description?.toLowerCase().includes(query);
      const matchesPinned =
        !showPinnedOnly || pinnedNotes.includes(String(note._id));

      return matchesSearch && matchesPinned;
    })
    .sort((a, b) => {
      const aPinned = pinnedNotes.includes(String(a._id));
      const bPinned = pinnedNotes.includes(String(b._id));
      const pinOrder = Number(bPinned) - Number(aPinned);
      if (pinOrder !== 0) return pinOrder;
      if (sortOrder === "az") return (a.title || "").localeCompare(b.title || "");
      if (sortOrder === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  // Download a backup of the user's notes as a text file
  const exportNotes = () => {
    if (!notes.length) { setNoteMessage("Create a note first, then you can export it!"); return; }
    const content = notes.map((note, index) => `${index + 1}. ${note.title}\n${note.description}\n\n------------------------------\n`).join("\n");
    const file = new Blob([`NoteNest - My Notes\n\n${content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notenest-my-notes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy a note to the clipboard, with a fallback for browser restrictions
  const copyNote = async (note) => {
    const content = `${note.title || "Untitled note"}\n\n${note.description || ""}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
        setNoteMessage("Note copied successfully!");
        return;
      }
    } catch (error) {
      console.warn("Clipboard API unavailable; trying fallback.", error);
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      setNoteMessage(
        copied
          ? "Note copied successfully!"
          : "Browser blocked copying. Please allow clipboard access."
      );
    } catch (error) {
      console.error("Copy note error:", error);
      setNoteMessage("Unable to copy this note.");
    }
  };

  // Format the note creation date safely
  const formatNoteDate = (date) => {
    if (!date) return "Date not available";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date not available";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Load dashboard and notes after login
  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: token };

    axios.get(`${API}/dashboard`, { headers })
      .then((res) => {
        setUserMessage(res.data.msg);
        fetchNotes();
      })
      .catch(() => {
        localStorage.removeItem("token");
        setToken("");
        setNotes([]);
        setPage("login");
      });
  }, [token]);

  const switchPage = (next) => {
    setPage(next);
    setMessage("");
  };

  // Login and Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const route =
        page === "login" ? "/user/login" : "/user/register";

      const response = await axios.post(`${API}${route}`, {
        name,
        email,
        password
      });

      setMessage(response.data.msg || "Request completed.");

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setToken(response.data.token);
        setUserMessage("Welcome to your personal space.");
      } else if (
        page === "register" &&
        response.data.msg === "User registered successfully"
      ) {
        setPage("login");
        setPassword("");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.msg ||
        "Can't reach the server. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Create or Update note
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    setNoteMessage("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle || !cleanDescription) {
      setNoteMessage("Please enter both title and description.");
      return;
    }

    if (cleanTitle.length > 100) {
      setNoteMessage("Title cannot exceed 100 characters.");
      return;
    }

    if (cleanDescription.length > 2000) {
      setNoteMessage("Description cannot exceed 2000 characters.");
      return;
    }

    setNoteLoading(true);

    try {
      const headers = { Authorization: token };

      const noteData = {
        title: cleanTitle,
        description: cleanDescription
      };

      if (editingId) {
        await axios.put(
          `${API}/notes/update/${editingId}`,
          noteData,
          { headers }
        );

        setNoteMessage("Note updated successfully!");
      } else {
        await axios.post(
          `${API}/notes/create`,
          noteData,
          { headers }
        );

        setNoteMessage("Note created successfully!");
      }

      setTitle("");
      setDescription("");
      setEditingId(null);

      await fetchNotes();

    } catch (error) {
      setNoteMessage(
        error.response?.data?.msg || "Something went wrong."
      );
    } finally {
      setNoteLoading(false);
    }
  };

  // Edit note
  const handleEdit = (note) => {
    setTitle(note.title);
    setDescription(note.description);
    setEditingId(note._id);
    setNoteMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete note
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API}/notes/delete/${id}`, {
        headers: { Authorization: token }
      });

      setNoteMessage("Note deleted successfully!");

      if (editingId === id) {
        setEditingId(null);
        setTitle("");
        setDescription("");
      }

      await fetchNotes();
    } catch (error) {
      setNoteMessage(
        error.response?.data?.msg || "Unable to delete note."
      );
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setName("");
    setEmail("");
    setPassword("");
    setTitle("");
    setDescription("");
    setNotes([]);
    setSearchTerm("");
    setShowPinnedOnly(false);
    setPinnedNotes([]);
    setEditingId(null);
    setMessage("");
    setNoteMessage("");
    setUserMessage("");
    setPage("login");
  };

  // Dashboard
  if (token) {
    return (
      <main className="dashboard-shell">
        <header className="dash-nav">
          <a className="brand" href="#">
            <span className="brand-mark">n</span> notenest
          </a>

          <button className="logout-btn" onClick={logout}>
            Log out <span>↗</span>
          </button>
        </header>

        <section className="dashboard-content">
          <div className="dash-kicker">
            <span className="live-dot" /> YOUR PERSONAL SPACE
          </div>

          <h1>
            Welcome back<span className="accent">.</span>
          </h1>

          <p className="dash-subtitle">
            A little space for all the thoughts worth keeping.
          </p>

          <div className="welcome-card">
            <div className="card-orb">✳</div>

            <div className="welcome-copy">
              <p className="card-label">YOU’RE SIGNED IN</p>
              <h2>{userMessage || "Your space is ready."}</h2>
              <p>
                Your personal notes are saved securely in your account.
              </p>
            </div>
            <div className="welcome-decoration" aria-hidden="true">✦</div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-icon">▤</span>
              <div className="stat-number-group"><strong>{notes.length}</strong><span>Total notes</span></div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">★</span>
              <div className="stat-number-group"><strong>{pinnedNotes.filter((id) => notes.some((note) => String(note._id) === id)).length}</strong><span>Pinned notes</span></div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⌕</span>
              <div className="stat-number-group"><strong>{filteredNotes.length}</strong><span>Showing</span></div>
            </div>
          </div>

          {/* Create and Update Note */}
          <section className="notes-section">
            <div className="notes-heading">
              <div>
                <p className="card-label">YOUR THOUGHTS · LITTLE IDEAS, BIG PLANS</p>
                <h2>
                  {editingId ? "Edit your note" : "Create a new note"}
                </h2>
              </div>
            </div>

            <form className="note-form" onSubmit={handleNoteSubmit}>
              <label>
                Note title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your note a title"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write your thoughts here..."
                  rows="4"
                  maxLength={2000}
                  required
                />
                <span className="writing-count">{description.length}/2000 characters · {description.trim() ? description.trim().split(/\s+/).length : 0} words</span>
              </label>

              <div className="note-form-actions">
                <button
                  className="submit-btn"
                  disabled={noteLoading}
                >
                  {noteLoading
                    ? "Please wait..."
                    : editingId
                    ? "Update note"
                    : "Save note"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setEditingId(null);
                      setTitle("");
                      setDescription("");
                      setNoteMessage("");
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {noteMessage && (
              <div className="message" role="status">
                {noteMessage}
              </div>
            )}
          </section>

          {/* Display, search and pin notes */}
          <section className="saved-notes">
            <div className="notes-heading">
              <div>
                <p className="card-label">YOUR COLLECTION</p>
                <h2>Your notes <span className="count-pill">{notes.length}</span></h2>
              </div>
              <span className="collection-caption">A home for your ideas</span>
            </div>

            <div className="notes-toolbar">
              <div className="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search your notes..."
                  aria-label="Search notes"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="toolbar-extra">
                <select className="sort-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="Sort notes">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="az">Title A–Z</option>
                </select>
                <button
                  type="button"
                  className="export-btn"
                  onClick={() => fetchNotes(true)}
                  disabled={refreshing}
                  title="Reload notes from the server"
                >
                  {refreshing ? "Refreshing..." : "↻ Refresh"}
                </button>
                <button type="button" className="export-btn" onClick={exportNotes}>↓ Export notes</button>
              </div>

              <div className="filter-tabs">
                <button
                  type="button"
                  className={!showPinnedOnly ? "filter-active" : ""}
                  onClick={() => setShowPinnedOnly(false)}
                >
                  All notes
                </button>
                <button
                  type="button"
                  className={showPinnedOnly ? "filter-active" : ""}
                  onClick={() => setShowPinnedOnly(true)}
                >
                  ★ Pinned
                </button>
              </div>
            </div>

            {notes.length === 0 ? (
              <div className="empty-notes">
                <span>✎</span>
                <h3>No notes yet.</h3>
                <p>Create your first note and it will appear here.</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="empty-notes">
                <span>⌕</span>
                <h3>No matching notes</h3>
                <p>Try another search or switch back to all notes.</p>
                <button
                  type="button"
                  className="empty-action"
                  onClick={() => {
                    setSearchTerm("");
                    setShowPinnedOnly(false);
                  }}
                >
                  Show all notes
                </button>
              </div>
            ) : (
              <div className="notes-grid">
                {filteredNotes.map((note) => {
                  const isPinned = pinnedNotes.includes(String(note._id));

                  return (
                    <article className={`note-card ${isPinned ? "is-pinned" : ""}`} key={note._id}>
                      <div className="note-card-top">
                        <span className="note-type-label">PERSONAL NOTE</span>
                        <button
                          type="button"
                          className={`pin-btn ${isPinned ? "pinned" : ""}`}
                          onClick={() => togglePin(note._id)}
                          aria-label={isPinned ? "Unpin note" : "Pin note"}
                          title={isPinned ? "Unpin note" : "Pin note"}
                        >
                          {isPinned ? "★ Pinned" : "☆ Pin"}
                        </button>
                      </div>
                      <h3>{note.title}</h3>
                      <p>{note.description}</p>
                      <span className="note-date">
                        Created: {formatNoteDate(note.createdAt)}
                      </span>

                      <div className="note-actions">
                        <button type="button" onClick={() => copyNote(note)}>
                          ⧉ Copy
                        </button>
                        <button type="button" onClick={() => handleEdit(note)}>
                          ✎ Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDelete(note._id)}
                        >
                          × Delete
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <footer className="site-footer">
          <span>notenest © 2026</span>
          <span>Keep it simple. Keep it yours.</span>
        </footer>
      </main>
    );
  }

  // Login and Register Page
  return (
    <main className="auth-layout">
      <section className="visual-side">
        <header className="brand">
          <span className="brand-mark">n</span> notenest
        </header>

        <div className="visual-copy">
          <div className="tiny-label">
            <span className="live-dot" /> A CALMER WAY TO KEEP IDEAS
          </div>

          <h1>
            Your mind is full.<br />
            Your notes can be <em>simple.</em>
          </h1>

          <p>
            A little home for your thoughts, plans and everyday inspiration.
            Sign in and make this space yours.
          </p>

          <div className="paper-stack">
            <div className="paper paper-back">
              <span>✳</span>
            </div>

            <div className="paper paper-front">
              <div className="paper-top">
                <span>MONDAY NOTES</span>
                <span>•••</span>
              </div>

              <h3>
                Little things<br />
                to remember
              </h3>

              <div className="paper-line">
                <i>✓</i> Start with one small step
              </div>

              <div className="paper-line">
                <i>✓</i> Make time for good ideas
              </div>

              <div className="paper-line muted">
                <i>○</i> Keep learning every day
              </div>

              <div className="paper-bottom">
                <span>YOUR SPACE, YOUR PACE</span>
                <b>✦</b>
              </div>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          <span>LESS CLUTTER, MORE CLARITY.</span>
          <span>© 2026 NOTENEST</span>
        </div>
      </section>

      <section className="form-side">
        <div className="form-top">
          <span>WELCOME TO YOUR SPACE</span>
          <span className="sparkle">✳</span>
        </div>

        <div className="auth-card">
          <div className="card-icon">✦</div>

          <p className="eyebrow">
            {page === "login"
              ? "NICE TO SEE YOU AGAIN"
              : "START SOMETHING GOOD"}
          </p>

          <h2>
            {page === "login"
              ? "Welcome back."
              : "Create your account."}
          </h2>

          <p className="form-intro">
            {page === "login"
              ? "Enter your details to continue to NoteNest."
              : "Just a few details and your space is ready."}
          </p>

          <div className="tabs">
            <button
              className={page === "login" ? "active" : ""}
              onClick={() => switchPage("login")}
              type="button"
            >
              Log in
            </button>

            <button
              className={page === "register" ? "active" : ""}
              onClick={() => switchPage("register")}
              type="button"
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {page === "register" && (
              <label>
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Komal"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            <button className="submit-btn" disabled={loading}>
              {loading
                ? "Please wait..."
                : page === "login"
                ? "Continue to NoteNest  →"
                : "Create my account  →"}
            </button>
          </form>

          {message && (
            <div
              className={`message ${
                message.toLowerCase().includes("success")
                  ? "success"
                  : ""
              }`}
              role="status"
            >
              {message}
            </div>
          )}

          <p className="switch-hint">
            {page === "login"
              ? "New around here? Create an account to get started."
              : "Already have an account? Choose Log in above."}
          </p>

          <div className="secure-note">
            <span>◈</span> Your account details are handled by the connected backend.
          </div>
        </div>

        <footer className="form-footer">
          A little more space for what matters.
        </footer>
      </section>
    </main>
  );
}

export default App;
