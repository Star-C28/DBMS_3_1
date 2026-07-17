import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { 
  Book as BookIcon, 
  User as UserIcon, 
  Plus, 
  Search, 
  LogOut, 
  BookOpen, 
  Calendar, 
  Shield, 
  Clock, 
  Trash2, 
  Bookmark, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  FileText,
  BookmarkCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Borrowing, User } from './types.ts';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App states
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-borrowed' | 'admin'>('catalog');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Admin Panel states
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookIsbn, setNewBookIsbn] = useState('');
  const [newBookCategory, setNewBookCategory] = useState('Fiction');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [newBookCopies, setNewBookCopies] = useState(1);
  const [newBookCoverUrl, setNewBookCoverUrl] = useState('');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setFirebaseUser(user);
        const userToken = await user.getIdToken();
        setToken(userToken);
        await fetchUserData(userToken);
      } else {
        setFirebaseUser(null);
        setToken(null);
        setDbUser(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch full application data when logged in
  useEffect(() => {
    if (token) {
      fetchBooks();
      fetchBorrowings();
    }
  }, [token]);

  const fetchUserData = async (authToken: string) => {
    try {
      const res = await fetch('/api/users/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
      } else {
        console.error("Failed to fetch user profiles");
      }
    } catch (err) {
      console.error("Error fetching user metadata:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleUserRole = async () => {
    if (!token) return;
    try {
      setAuthLoading(true);
      const res = await fetch('/api/users/toggle-role', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDbUser(data.user);
        showNotification("Role updated successfully!", "success");
        // Re-fetch borrowings since the view scope changes
        fetchBorrowings();
      }
    } catch (err) {
      console.error("Error switching roles:", err);
      showNotification("Failed to switch role", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error("Error fetching library books:", err);
    }
  };

  const fetchBorrowings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/borrowings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBorrowings(data);
      }
    } catch (err) {
      console.error("Error fetching library borrowings:", err);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      console.error("Login failed:", err);
      showNotification(err.message || "Failed to log in with Google", "error");
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      showNotification("Logged out successfully", "success");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleBorrow = async (bookId: number) => {
    if (!token) return;
    setActionLoading(`borrow-${bookId}`);
    try {
      const res = await fetch('/api/borrowings/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();

      if (res.ok) {
        showNotification("বইটি সফলভাবে ধার নেওয়া হয়েছে! (Book borrowed successfully!)", "success");
        fetchBooks();
        fetchBorrowings();
      } else {
        showNotification(data.error || "Failed to borrow book", "error");
      }
    } catch (err) {
      console.error("Error borrowing book:", err);
      showNotification("Network error borrowing book", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (borrowingId: number) => {
    if (!token) return;
    setActionLoading(`return-${borrowingId}`);
    try {
      const res = await fetch(`/api/borrowings/${borrowingId}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        showNotification("বইটি সফলভাবে ফেরত দেওয়া হয়েছে! (Book returned successfully!)", "success");
        fetchBooks();
        fetchBorrowings();
      } else {
        showNotification(data.error || "Failed to return book", "error");
      }
    } catch (err) {
      console.error("Error returning book:", err);
      showNotification("Network error returning book", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setActionLoading('add-book');
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newBookTitle,
          author: newBookAuthor,
          isbn: newBookIsbn,
          category: newBookCategory,
          description: newBookDescription,
          copies: newBookCopies,
          coverUrl: newBookCoverUrl || `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60`
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        showNotification("নতুন বই তালিকায় যুক্ত করা হয়েছে! (New book added successfully!)", "success");
        // Reset inputs
        setNewBookTitle('');
        setNewBookAuthor('');
        setNewBookIsbn('');
        setNewBookCategory('Fiction');
        setNewBookDescription('');
        setNewBookCopies(1);
        setNewBookCoverUrl('');
        
        fetchBooks();
      } else {
        showNotification(data.error || "Failed to add book", "error");
      }
    } catch (err) {
      console.error("Error adding book:", err);
      showNotification("Network error adding book", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    setActionLoading(`delete-${bookId}`);
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        showNotification("বইটি তালিকা থেকে মুছে ফেলা হয়েছে (Book deleted successfully)", "success");
        fetchBooks();
        fetchBorrowings();
      } else {
        showNotification(data.error || "Failed to delete book", "error");
      }
    } catch (err) {
      console.error("Error deleting book:", err);
      showNotification("Network error deleting book", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Filter books based on search and category
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (book.isbn && book.isbn.includes(searchQuery));
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories for filtering
  const categories = ['All', ...Array.from(new Set(books.map(b => b.category)))];

  // Helper stats
  const totalBooksCount = books.reduce((sum, b) => sum + b.copies, 0);
  const availableBooksCount = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const activeBorrowCount = borrowings.filter(b => b.status === 'borrowed').length;

  if (authLoading && !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">লোড হচ্ছে... (Loading library...)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 text-[14px]">
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-medium"
          >
            <CheckCircle className="h-5 w-5 text-blue-100" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-rose-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 font-medium"
          >
            <AlertCircle className="h-5 w-5 text-rose-100" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!firebaseUser ? (
        /* GORGEOUS LANDING AND SIGN IN PAGE */
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen w-full">
          {/* Visual Side */}
          <div className="lg:w-1/2 bg-slate-950 text-white p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent)] pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <BookIcon className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">BiblioSQL</span>
            </div>

            <div className="my-auto py-12 relative z-10">
              <span className="bg-slate-900 text-blue-400 text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full border border-slate-800">
                Relational Cloud SQL Backend
              </span>
              <h1 className="font-display text-4xl lg:text-5xl font-extrabold tracking-tight mt-6 leading-tight">
                লাইব্রেরি ম্যানেজমেন্ট সিস্টেম <br />
                <span className="text-blue-500">Library Management System</span>
              </h1>
              <p className="text-slate-400 text-base mt-6 max-w-lg leading-relaxed">
                এটি একটি আধুনিক রিলেশনাল ডেটাবেস যুক্ত লাইব্রেরি ওয়েব অ্যাপ্লিকেশান। এর মাধ্যমে খুব সহজেই বই যুক্ত করা, বই ধার নেওয়া এবং ফেরত দেওয়ার হিসাব নিখুঁতভাবে সংরক্ষণ করা যায়।
              </p>
              
              <div className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-900 pt-8">
                <div>
                  <h3 className="text-blue-500 font-bold text-xl font-display">Fast & Real</h3>
                  <p className="text-slate-400 text-xs mt-1">PostgreSQL Cloud SQL persistent engine.</p>
                </div>
                <div>
                  <h3 className="text-blue-500 font-bold text-xl font-display">Secure</h3>
                  <p className="text-slate-400 text-xs mt-1">Firebase Google OAuth Authentication.</p>
                </div>
              </div>
            </div>

            <div className="text-slate-500 text-xs relative z-10">
              Powered by Antigravity & Google Cloud SQL Developer Edition
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:w-1/2 bg-slate-50 flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md bg-white rounded-3xl p-10 border border-slate-100 shadow-xl"
            >
              <div className="text-center">
                <h2 className="text-3xl font-display font-extrabold text-slate-900">শুরু করা যাক!</h2>
                <p className="text-slate-500 mt-2 text-sm">লাইব্রেরি ড্যাশবোর্ড অ্যাক্সেস করতে অনুগ্রহ করে লগইন করুন।</p>
              </div>

              <div className="mt-10">
                <button
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-2xl transition duration-200 cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 text-sm"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Google দিয়ে লগইন করুন (Google Login)</span>
                </button>
              </div>

              <div className="mt-8 border-t border-slate-100 pt-6">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex gap-3 items-start">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">নিরাপদ ডেমো মোড</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      এটি একটি সুরক্ষিত ওয়েব অ্যাপ্লিকেশন। লগইন সম্পন্ন করার পর আপনি সহজেই "Admin/Member" রোলটি টগল করে সব ফিচার পরীক্ষা করতে পারবেন।
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        /* MAIN DASHBOARD APPLICATION WITH SLEEK SIDEBAR */
        <div className="flex flex-col lg:flex-row w-full min-h-screen">
          
          {/* 1. Sidebar Panel (Desktop view) */}
          <aside className="hidden lg:flex w-64 bg-slate-900 flex-col border-r border-slate-800 text-slate-400 shrink-0 min-h-screen sticky top-0">
            {/* Logo area */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight block leading-none">BiblioSQL</span>
                <span className="text-[10px] text-blue-400 font-medium block mt-1">গ্রন্থালয় লাইব্রেরি</span>
              </div>
            </div>

            {/* Nav area */}
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-3 ml-2">Management</div>
              
              <button 
                onClick={() => setActiveTab('catalog')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'catalog'
                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>বইয়ের তালিকা (Catalog)</span>
              </button>

              <button 
                onClick={() => setActiveTab('my-borrowed')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'my-borrowed'
                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-5 h-5" />
                <span>আমার বইসমূহ (My Books)</span>
                {activeBorrowCount > 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold bg-blue-600/20 text-blue-400">
                    {activeBorrowCount}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-left ${
                  activeTab === 'admin'
                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>অ্যাডমিন প্যানেল (Admin)</span>
                {dbUser?.role !== 'admin' && (
                  <span className="ml-auto text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">PRO</span>
                )}
              </button>

              {/* Developer Option: Toggle Role in Sidebar */}
              <div className="pt-4 border-t border-slate-800 mt-6">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-3 ml-2">Testing Actions</div>
                <button
                  onClick={toggleUserRole}
                  disabled={authLoading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-blue-400 hover:bg-slate-800 hover:text-blue-200 transition cursor-pointer text-left"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${authLoading ? 'animate-spin' : ''}`} />
                  <span>{dbUser?.role === 'admin' ? 'Become Member' : 'Become Admin'}</span>
                </button>
              </div>
            </nav>

            {/* DB Status Section */}
            <div className="p-6 border-t border-slate-800">
              <div className="bg-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">DB Status</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-300 font-mono text-[10px] truncate" title="Google Cloud SQL Instance connection status">
                    Cloud SQL (PostgreSQL)
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* 2. Responsive Top Navigation (Mobile view) */}
          <nav className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                <span className="font-bold text-slate-900 text-base font-display">BiblioSQL</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleUserRole}
                  disabled={authLoading}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition"
                >
                  <RefreshCw className={`h-3 w-3 ${authLoading ? 'animate-spin' : ''}`} />
                  <span>{dbUser?.role === 'admin' ? 'Member' : 'Admin'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile Tab Pills */}
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                  activeTab === 'catalog'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Catalog
              </button>
              <button
                onClick={() => setActiveTab('my-borrowed')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition flex items-center gap-1 ${
                  activeTab === 'my-borrowed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                My Books
                {activeBorrowCount > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'my-borrowed' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
                    {activeBorrowCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                Admin Panel {dbUser?.role !== 'admin' && '🔒'}
              </button>
            </div>
          </nav>

          {/* 3. Main content workspace area */}
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Desktop header */}
            <header className="hidden lg:flex h-16 border-b border-slate-200 bg-white items-center justify-between px-8 sticky top-0 z-40">
              <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-full w-96">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ISBN, Title or Author..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full text-slate-800 placeholder-slate-400 focus:ring-0" 
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">
                      {firebaseUser.displayName || firebaseUser.email || 'Library User'}
                    </p>
                    <p className="text-[10px] text-blue-600 font-bold tracking-wide uppercase">
                      {dbUser?.role === 'admin' ? '🔴 Admin' : '🟢 Member'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 overflow-hidden flex items-center justify-center font-bold text-blue-700 text-xs shadow-sm">
                    {firebaseUser.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      firebaseUser.displayName?.charAt(0) || firebaseUser.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                </div>

                <div className="h-6 w-px bg-slate-200" />

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </header>

            {/* DB Status connection banner */}
            <div className="bg-blue-50 border-b border-blue-100/50 py-2 px-6 flex items-center justify-center lg:justify-start gap-2">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              <p className="text-xs text-blue-800 font-medium">
                ⚡ Live PostgreSQL Cloud SQL database connection active.
              </p>
            </div>

            {/* Scrollable content panel */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col gap-8 overflow-y-auto">
              
              {/* Overview Header Section */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 font-display">Library Overview</h1>
                  <p className="text-slate-500 text-sm">Summary of library circulation and assets.</p>
                </div>
                {activeTab !== 'admin' && (
                  <button 
                    onClick={() => {
                      setActiveTab('admin');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all text-xs flex items-center gap-1.5 self-start cursor-pointer font-sans"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register New Book</span>
                  </button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                    <BookIcon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-display text-slate-900">{totalBooksCount}</div>
                  <div className="text-slate-500 text-xs font-medium">Total Volumes</div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <BookmarkCheck className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-display text-slate-900">{availableBooksCount}</div>
                  <div className="text-slate-500 text-xs font-medium">Books Available</div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold font-display text-slate-900">{activeBorrowCount}</div>
                  <div className="text-slate-500 text-xs font-medium">Books Issued</div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="text-lg font-bold font-display text-slate-900 truncate uppercase mt-1">
                    {dbUser?.role === 'admin' ? 'Admin 👑' : 'Member 👤'}
                  </div>
                  <div className="text-slate-500 text-xs font-medium">Your Session Role</div>
                </div>
              </div>

              {/* Active Tab Workspace Container */}
              <div className="flex-1 w-full min-w-0">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: CATALOGUE */}
                  {activeTab === 'catalog' && (
                    <motion.div
                      key="catalog"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Search and Filters */}
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-80 lg:hidden">
                          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="বই অথবা লেখকের নাম খুঁজুন..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                          />
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
                          {categories.map(category => (
                            <button
                              key={category}
                              onClick={() => setSelectedCategory(category)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition ${
                                selectedCategory === category 
                                  ? 'bg-blue-600 text-white shadow-sm' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                        
                        <div className="text-xs text-slate-400 font-medium hidden md:block">
                          Showing {filteredBooks.length} items
                        </div>
                      </div>

                      {/* Books Grid */}
                      {filteredBooks.length === 0 ? (
                        <div className="bg-white text-center py-16 rounded-2xl border border-slate-100 shadow-sm">
                          <BookIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-semibold">কোনো বই পাওয়া যায়নি (No books found)</p>
                          <p className="text-slate-400 text-xs mt-1">অনুগ্রহ করে অন্য কোনো কি-ওয়ার্ড দিয়ে খুঁজুন বা নতুন বই যুক্ত করুন।</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {filteredBooks.map(book => {
                            const isOut = book.availableCopies <= 0;
                            const isBorrowing = actionLoading === `borrow-${book.id}`;
                            const hasBorrowed = borrowings.some(b => b.bookId === book.id && b.status === 'borrowed');

                            return (
                              <motion.div
                                key={book.id}
                                layout
                                className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-slate-200 transition duration-200 flex flex-col h-full"
                              >
                                {/* Cover image */}
                                <div className="h-48 bg-slate-50 relative overflow-hidden shrink-0">
                                  <img
                                    src={book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60'}
                                    alt={book.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-3 right-3">
                                    <span className="bg-blue-600/10 text-blue-600 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                                      {book.category}
                                    </span>
                                  </div>
                                </div>

                                {/* Details body */}
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                  <div>
                                    <h3 className="font-display font-bold text-slate-900 text-base leading-snug line-clamp-1">{book.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">by {book.author}</p>
                                    
                                    {book.isbn && (
                                      <p className="text-[10px] font-mono text-slate-400 mt-2 bg-slate-50 px-2 py-0.5 rounded self-start inline-block">ISBN: {book.isbn}</p>
                                    )}

                                    <p className="text-xs text-slate-600 mt-3.5 line-clamp-2 leading-relaxed min-h-[32px]">
                                      {book.description || 'No description provided.'}
                                    </p>
                                  </div>

                                  <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                                    {/* Availability */}
                                    <div className="text-left">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Availability</p>
                                      <p className="text-xs font-semibold mt-1">
                                        {isOut ? (
                                          <span className="text-rose-600">🔴 Out of Stock</span>
                                        ) : (
                                          <span className="text-emerald-600">🟢 {book.availableCopies} / {book.copies} available</span>
                                        )}
                                      </p>
                                    </div>

                                    {/* Actions */}
                                    {hasBorrowed ? (
                                      <span className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 border border-blue-100">
                                        <CheckCircle className="h-4 w-4" />
                                        Checked Out
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleBorrow(book.id)}
                                        disabled={isOut || isBorrowing}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                          isOut 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10'
                                        }`}
                                      >
                                        {isBorrowing ? (
                                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Bookmark className="h-3.5 w-3.5" />
                                        )}
                                        <span>Borrow</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 2: MY BORROWED BOOKS */}
                  {activeTab === 'my-borrowed' && (
                    <motion.div
                      key="my-borrowed"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      <div className="p-6 border-b border-slate-50">
                        <h2 className="text-lg font-display font-bold text-slate-900">আমার ধার নেওয়া বইসমূহ (My Borrowed History)</h2>
                        <p className="text-xs text-slate-500 mt-1">এখানে আপনার সংগ্রহে থাকা বই এবং পূর্বের ফেরত দেওয়ার ইতিহাস দেখা যাবে।</p>
                      </div>

                      {borrowings.length === 0 ? (
                        <div className="p-16 text-center text-slate-500">
                          <Bookmark className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                          <p className="font-semibold text-slate-700">আপনার তালিকায় বর্তমানে কোনো বই নেই (No borrowed books)</p>
                          <p className="text-xs text-slate-400 mt-1">লাইব্রেরি ক্যাটাগরি থেকে যেকোনো বই ধার নিয়ে পড়া শুরু করুন!</p>
                          <button
                            onClick={() => setActiveTab('catalog')}
                            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            <span>বই ব্রাউজ করুন</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                <th className="py-3 px-6">বইয়ের বিবরণ (Book Details)</th>
                                <th className="py-3 px-6">ধার নেওয়া হয়েছে (Borrowed On)</th>
                                <th className="py-3 px-6">ফেরত দেওয়ার তারিখ (Due Date)</th>
                                <th className="py-3 px-6">অবস্থা (Status)</th>
                                <th className="py-3 px-6 text-right">পদক্ষেপ (Actions)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                              {borrowings.map((borrow) => {
                                const isOverdue = new Date(borrow.dueDate) < new Date() && borrow.status === 'borrowed';
                                const isReturning = actionLoading === `return-${borrow.id}`;

                                return (
                                  <tr key={borrow.id} className="hover:bg-slate-50/50 transition">
                                    <td className="py-4 px-6">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-9 rounded overflow-hidden bg-slate-50 shrink-0 border border-slate-200 shadow-sm">
                                          <img
                                            src={borrow.bookCoverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60'}
                                            alt={borrow.bookTitle}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900 line-clamp-1">{borrow.bookTitle}</p>
                                          <p className="text-[11px] text-slate-400 mt-0.5">by {borrow.bookAuthor}</p>
                                        </div>
                                      </div>
                                    </td>
                                    
                                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                                      {new Date(borrow.borrowedAt).toLocaleDateString()}
                                    </td>

                                    <td className="py-4 px-6 font-mono text-xs">
                                      {borrow.returnedAt ? (
                                        <span className="text-slate-400 line-through">
                                          {new Date(borrow.dueDate).toLocaleDateString()}
                                        </span>
                                      ) : (
                                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                          {new Date(borrow.dueDate).toLocaleDateString()}
                                          {isOverdue && ' (সময় পার হয়েছে!)'}
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-4 px-6">
                                      {borrow.status === 'returned' ? (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                                          Returned
                                        </span>
                                      ) : isOverdue ? (
                                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase animate-pulse">
                                          Overdue
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                          Borrowed
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-4 px-6 text-right">
                                      {borrow.status === 'borrowed' && (
                                        <button
                                          onClick={() => handleReturn(borrow.id)}
                                          disabled={isReturning}
                                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs"
                                        >
                                          {isReturning ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <CheckCircle className="h-3 w-3" />
                                          )}
                                          <span>Return Book</span>
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: ADMIN PANEL */}
                  {activeTab === 'admin' && (
                    <motion.div
                      key="admin"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      {/* Check role */}
                      {dbUser?.role !== 'admin' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
                          <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <h3 className="text-amber-800 font-bold font-display">অ্যাডমিন অ্যাক্সেস রিকোয়ার্ড (Developer Simulator Active)</h3>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                              আপনি বর্তমানে একজন "Member" হিসেবে আছেন। অ্যাডমিন প্যানেলে বই যুক্ত করা বা সবার ট্রানজেকশন তালিকা দেখার জন্য উপরে ডানে থাকা <strong>Admin হন</strong> বাটনে ক্লিক করে নিজেকে অ্যাডমিন হিসেবে প্রমোট করে নিতে পারবেন।
                            </p>
                            <button
                              onClick={toggleUserRole}
                              className="mt-3 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl cursor-pointer shadow-sm transition"
                            >
                              সহজেই অ্যাডমিন হোন (Become Admin)
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col lg:flex-row gap-8 items-start">
                        
                        {/* Form container */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm w-full lg:w-96 shrink-0">
                          <h3 className="font-display font-extrabold text-slate-900 text-base mb-1 flex items-center gap-1.5">
                            <Plus className="h-5 w-5 text-blue-600" />
                            নতুন বই তালিকাভুক্ত করুন
                          </h3>
                          <p className="text-xs text-slate-500 mb-6">লাইব্রেরিতে নতুন বইয়ের স্টক ও বিবরণী সংযোজন করুন।</p>

                          <form onSubmit={handleAddBook} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">বইয়ের নাম (Title) *</label>
                              <input
                                type="text"
                                required
                                placeholder="উদাঃ পথের পাঁচালী, গীতাঞ্জলি"
                                value={newBookTitle}
                                onChange={(e) => setNewBookTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">লেখক (Author) *</label>
                              <input
                                type="text"
                                required
                                placeholder="উদাঃ রবীন্দ্রনাথ ঠাকুর"
                                value={newBookAuthor}
                                onChange={(e) => setNewBookAuthor(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">ক্যাটাগরি (Category)</label>
                                <select
                                  value={newBookCategory}
                                  onChange={(e) => setNewBookCategory(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                >
                                  <option value="Fiction">Fiction</option>
                                  <option value="Classic">Classic</option>
                                  <option value="Fantasy">Fantasy</option>
                                  <option value="Dystopian">Dystopian</option>
                                  <option value="Technology">Technology</option>
                                  <option value="Biography">Biography</option>
                                  <option value="History">History</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">সংখ্যা (Copies)</label>
                                <input
                                  type="number"
                                  min="1"
                                  required
                                  value={newBookCopies}
                                  onChange={(e) => setNewBookCopies(parseInt(e.target.value) || 1)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">ISBN কোড</label>
                              <input
                                type="text"
                                placeholder="উদাঃ 9789350462002"
                                value={newBookIsbn}
                                onChange={(e) => setNewBookIsbn(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">কভার ইমেজ লিংক (URL)</label>
                              <input
                                type="url"
                                placeholder="Unsplash বা যেকোনো ছবির লিংক"
                                value={newBookCoverUrl}
                                onChange={(e) => setNewBookCoverUrl(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs transition"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">সংক্ষিপ্ত বিবরণী (Description)</label>
                              <textarea
                                placeholder="বইয়ের ছোট একটি রিভিউ বা সারসংক্ষেপ..."
                                value={newBookDescription}
                                onChange={(e) => setNewBookDescription(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={dbUser?.role !== 'admin' || actionLoading === 'add-book'}
                              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer shadow-md shadow-blue-500/10 text-sm"
                            >
                              {actionLoading === 'add-book' ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                              <span>তালিকায় যুক্ত করুন</span>
                            </button>
                          </form>
                        </div>

                        {/* Logs and operation lists */}
                        <div className="flex-1 w-full space-y-8">
                          
                          {/* All Borrowings */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-50 flex items-center bg-slate-50/50 gap-2">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <h3 className="font-display font-bold text-slate-900 text-sm">গ্লোবাল ট্রানজেকশন লগ (All Borrowings Log)</h3>
                                <p className="text-xs text-slate-500 mt-0.5">সব মেম্বারের বই সংগ্রহের পূর্ণাঙ্গ বিবরণ ও ফেরত দেওয়ার ট্র্যাকার।</p>
                              </div>
                            </div>

                            {borrowings.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 text-xs">
                                কোনো ট্রানজেকশন পাওয়া যায়নি (No borrowings yet).
                              </div>
                            ) : (
                              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                                      <th className="py-3 px-5">ইউজার (User)</th>
                                      <th className="py-3 px-5">বই (Book)</th>
                                      <th className="py-3 px-5">তারিখ (Borrowed)</th>
                                      <th className="py-3 px-5">অবস্থা (Status)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-xs">
                                    {borrowings.map((borrow) => (
                                      <tr key={borrow.id} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3 px-5 font-medium text-slate-800">
                                          <p className="font-bold">{borrow.userName || 'Unknown'}</p>
                                          <p className="text-[10px] text-slate-400">{borrow.userEmail}</p>
                                        </td>
                                        <td className="py-3 px-5 text-slate-600 font-semibold truncate max-w-[150px]">
                                          {borrow.bookTitle}
                                        </td>
                                        <td className="py-3 px-5 font-mono text-slate-500">
                                          {new Date(borrow.borrowedAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-5">
                                          {borrow.status === 'returned' ? (
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase">
                                              Returned
                                            </span>
                                          ) : (
                                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold uppercase animate-pulse">
                                              Active
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Operations lists */}
                          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BookIcon className="h-5 w-5 text-blue-600" />
                                <div>
                                  <h3 className="font-display font-bold text-slate-900 text-sm">ক্যাটালগ পরিচালনা (Catalog Operations)</h3>
                                  <p className="text-xs text-slate-500 mt-0.5">বই ক্যাটালগ সংশোধন বা স্টক তালিকা থেকে অপসারণ করুন।</p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                                {books.length} Books
                              </span>
                            </div>

                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider sticky top-0">
                                    <th className="py-3 px-5">বইয়ের বিবরণ (Book)</th>
                                    <th className="py-3 px-5">ক্যাটাগরি (Category)</th>
                                    <th className="py-3 px-5">স্টক (Stock)</th>
                                    <th className="py-3 px-5 text-right">অপশন (Delete)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                  {books.map((book) => {
                                    const isDeleting = actionLoading === `delete-${book.id}`;
                                    return (
                                      <tr key={book.id} className="hover:bg-slate-50/50 transition">
                                        <td className="py-3 px-5 font-medium text-slate-800">
                                          <p className="font-bold text-slate-800">{book.title}</p>
                                          <p className="text-[10px] text-slate-400">by {book.author}</p>
                                        </td>
                                        <td className="py-3 px-5 text-slate-500 font-semibold">
                                          {book.category}
                                        </td>
                                        <td className="py-3 px-5 font-mono text-slate-500">
                                          {book.availableCopies} / {book.copies} available
                                        </td>
                                        <td className="py-3 px-5 text-right">
                                          <button
                                            onClick={() => handleDeleteBook(book.id)}
                                            disabled={dbUser?.role !== 'admin' || isDeleting}
                                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer disabled:opacity-40"
                                            title="Delete Book"
                                          >
                                            {isDeleting ? (
                                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>

                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
              <p>© {new Date().getFullYear()} BiblioSQL লাইব্রেরি ম্যানেজমেন্ট সিস্টেম। সর্বস্বত্ব সংরক্ষিত।</p>
              <p className="mt-1">Built with React, Vite, Express, and Google Cloud SQL (PostgreSQL)</p>
            </footer>

          </div>

        </div>
      )}

    </div>
  );
}

