import { useEffect, useState } from 'react'
import { api, getToken } from './api'

const blankLogin = { email: '', password: '' }
const blankRegister = { name: '', email: '', password: '' }
const blankBook = { title: '', author: '', category: '', isbn: '', available: true }

export default function App() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(blankLogin)
  const [user, setUser] = useState(null)
  const [books, setBooks] = useState([])
  const [selectedBook, setSelectedBook] = useState(null)
  const [search, setSearch] = useState('')
  const [bookForm, setBookForm] = useState(blankBook)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function loadBooks(query = search) {
    try {
      const suffix = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''
      setBooks(await api(`/api/books${suffix}`))
    } catch (e) { setError(e.message) }
  }

  async function loadUser() {
    if (!getToken()) return
    try { setUser(await api('/api/auth/me')) }
    catch { localStorage.removeItem('bookhub_token'); setUser(null) }
  }

  useEffect(() => { loadUser(); loadBooks('') }, [])

  function changeForm(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  function changeBook(e) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setBookForm({ ...bookForm, [e.target.name]: value })
  }

  async function submitAuth(e) {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true)
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const payload = await api(endpoint, { method: 'POST', body: JSON.stringify(form) })
      localStorage.setItem('bookhub_token', payload.token)
      setUser({ id: payload.id, name: payload.name, email: payload.email, role: payload.role })
      setForm(blankLogin); setNotice(mode === 'register' ? 'Account created successfully.' : 'Welcome back!')
      await loadBooks('')
    } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }

  function logout() {
    localStorage.removeItem('bookhub_token'); setUser(null); setNotice('You have logged out.')
  }

  async function addBook(e) {
    e.preventDefault(); setError(''); setNotice('')
    try {
      await api('/api/books', { method: 'POST', body: JSON.stringify(bookForm) })
      setBookForm(blankBook); setNotice('Book added successfully.'); await loadBooks('')
    } catch (e) { setError(e.message) }
  }

  async function deleteBook(id) {
    if (!window.confirm('Delete this book?')) return
    try {
      await api(`/api/books/${id}`, { method: 'DELETE' })
      setNotice('Book deleted.'); await loadBooks()
    } catch (e) { setError(e.message) }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); loadBooks('') }}>
        <span className="brand-mark">B</span><span>BookHub<small>ONLINE BOOK MANAGEMENT</small></span>
      </a>
      <div className="nav-actions">
        {user ? <><span className="welcome">Hi, {user.name}</span><span className="role">{user.role}</span><button className="button button-light" onClick={logout}>Log out</button></>
          : <button className="button button-light" onClick={() => { setMode('login'); setForm(blankLogin) }}>Sign in</button>}
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h1>Every book.<br /><span>One place.</span></h1>
          <p className="hero-text">Discover books, explore authors, and keep your reading world organised with BookHub.</p>
          <a className="button button-primary hero-button" href="#catalog">Explore the catalogue <span>→</span></a>
        </div>
        <div className="hero-art" aria-label="Decorative stack of books">
          <div className="sun"></div><div className="book book-one">READ<br/>MORE</div><div className="book book-two"></div><div className="book book-three"></div><div className="book book-four"></div><div className="plant">✦</div>
        </div>
      </section>

      {(notice || error) && <div className={error ? 'alert alert-error' : 'alert alert-success'}>{error || notice}<button onClick={() => { setError(''); setNotice('') }}>×</button></div>}

      <section className="content-grid">
        <aside className="panel auth-panel">
          {user ? <div className="account-view">
            <div className="avatar">{user.name?.charAt(0)?.toUpperCase()}</div>
            <p className="eyebrow">YOUR ACCOUNT</p><h2>Welcome, {user.name}</h2>
            <p className="muted">{user.email}</p><span className="role role-large">{user.role}</span>
            <div className="account-note"><strong>You're signed in.</strong><br/>Your account is authenticated and ready to use.</div>
          </div> : <>
            <div className="panel-heading"><p className="eyebrow">MEMBER ACCESS</p><h2>{mode === 'register' ? 'Create account' : 'Welcome back'}</h2><p className="muted">{mode === 'register' ? 'Join BookHub in a few simple steps.' : 'Sign in to access your account.'}</p></div>
            <form className="form" onSubmit={submitAuth}>
              {mode === 'register' && <label>Full name<input name="name" value={form.name || ''} onChange={changeForm} placeholder="Your name" minLength="2" required /></label>}
              <label>Email address<input type="email" name="email" value={form.email} onChange={changeForm} placeholder="you@example.com" required /></label>
              <label>Password<input type="password" name="password" value={form.password} onChange={changeForm} placeholder="At least 8 characters" minLength="8" required /></label>
              <button className="button button-primary full-width" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
            </form>
            <p className="switch-mode">{mode === 'register' ? 'Already have an account?' : 'New to BookHub?'} <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setForm(mode === 'register' ? blankLogin : blankRegister); setError('') }}>{mode === 'register' ? 'Sign in' : 'Create account'}</button></p>
            <p className="security-note">🔒 Your password is securely hashed on the server.</p>
          </>}
        </aside>

        <section className="catalog panel" id="catalog">
          <div className="catalog-header"><div><p className="eyebrow">THE COLLECTION</p><h2>Book catalogue</h2><p className="muted">Find your next favourite read.</p></div><div className="book-count">{books.length}<small>BOOKS</small></div></div>
          <form className="search-row" onSubmit={e => { e.preventDefault(); loadBooks(search) }}>
            <span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title, author, category or ISBN…" /><button className="button button-dark">Search</button>
          </form>
          {user?.role === 'ADMIN' && <form className="admin-form" onSubmit={addBook}>
            <h3>Add a book <span>ADMIN</span></h3>
            <div className="admin-fields">
              <input aria-label="Book title" placeholder="Title *" value={bookForm.title} name="title" onChange={changeBook} required />
              <input aria-label="Author" placeholder="Author *" value={bookForm.author} name="author" onChange={changeBook} required />
              <input aria-label="Category" placeholder="Category" value={bookForm.category} name="category" onChange={changeBook} />
              <input aria-label="ISBN" placeholder="ISBN" value={bookForm.isbn} name="isbn" onChange={changeBook} />
            </div>
            <button className="button button-primary">Add book</button>
          </form>}
          
{selectedBook && (
  <div className="panel book-details">
    <h2>{selectedBook.title}</h2>
    <p><strong>Author:</strong> {selectedBook.author}</p>
    <p><strong>Category:</strong> {selectedBook.category || 'General'}</p>
    <p><strong>ISBN:</strong> {selectedBook.isbn || 'Not provided'}</p>
    <p>
      <strong>Status:</strong>{' '}
      {selectedBook.available ? 'Available' : 'Unavailable'}
    </p>
    <button
      className="button button-light"
      onClick={() => setSelectedBook(null)}
    >
      Close details
    </button>
  </div>
)}

          <div className="book-list">
            {books.length === 0 ? <div className="empty-state"><span>▤</span><h3>No books found</h3><p>Try another search or add books as an admin.</p></div> : books.map((book, index) => <article className="book-item" key={book.id}>
              
<div
  className={`book-cover cover-${index % 4}`}
  role="button"
  tabIndex={0}
  onClick={() => setSelectedBook(book)}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') setSelectedBook(book)
  }}
>
  <span>{book.title?.slice(0, 1)?.toUpperCase()}</span>
  <small>BOOKHUB</small>
</div>

              <div className="book-info"><span className="category">{book.category || 'GENERAL'}</span><h3>{book.title}</h3><p>by {book.author}</p>{book.isbn && <small className="isbn">ISBN: {book.isbn}</small>}<div><span className={book.available ? 'availability available' : 'availability unavailable'}>{book.available ? 'Available' : 'Unavailable'}</span></div></div>
              {user?.role === 'ADMIN' && <button className="delete-button" title="Delete book" onClick={() => deleteBook(book.id)}>×</button>}
            </article>)}
          </div>
          <p className="catalog-foot">Showing {books.length} {books.length === 1 ? 'book' : 'books'} · Updated from your BookHub database</p>
        </section>
      </section>
    </main>
    <footer><div className="footer-brand">BookHub<span>®</span></div><p>Making every page count.</p><small>Full-stack student project · React + Spring Boot + MySQL</small></footer>
  </div>
}
