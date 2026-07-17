import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { books, borrowings, users } from "./src/db/schema.ts";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { eq, and, desc } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log requests for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // --- API ROUTES ---

  // 1. Get Me / User Info
  app.get("/api/users/me", requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.dbUser });
  });

  // 2. Toggle User Role (convenient for testing Admin/Member flows)
  app.post("/api/users/toggle-role", requireAuth, async (req: AuthRequest, res) => {
    try {
      const newRole = req.dbUser.role === 'admin' ? 'member' : 'admin';
      const updated = await db.update(users)
        .set({ role: newRole })
        .where(eq(users.id, req.dbUser.id))
        .returning();
      
      res.json({ success: true, user: updated[0] });
    } catch (error) {
      console.error("Failed to toggle role:", error);
      res.status(500).json({ error: "Failed to toggle role" });
    }
  });

  // 3. Get all books
  app.get("/api/books", async (req, res) => {
    try {
      const allBooks = await db.select().from(books).orderBy(desc(books.createdAt));
      res.json(allBooks);
    } catch (error) {
      console.error("Failed to retrieve books:", error);
      res.status(500).json({ error: "Failed to retrieve books" });
    }
  });

  // 4. Create book (Admin only)
  app.post("/api/books", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admin role required" });
      }

      const { title, author, isbn, category, description, copies, coverUrl } = req.body;
      if (!title || !author) {
        return res.status(400).json({ error: "Title and Author are required" });
      }

      const numCopies = parseInt(copies) || 1;

      const newBook = await db.insert(books)
        .values({
          title,
          author,
          isbn: isbn || null,
          category: category || "General",
          description: description || null,
          copies: numCopies,
          availableCopies: numCopies,
          coverUrl: coverUrl || null,
        })
        .returning();

      res.status(211).json(newBook[0]);
    } catch (error) {
      console.error("Failed to create book:", error);
      res.status(500).json({ error: "Failed to create book" });
    }
  });

  // 5. Update book (Admin only)
  app.put("/api/books/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admin role required" });
      }

      const bookId = parseInt(req.params.id);
      const { title, author, isbn, category, description, copies, coverUrl } = req.body;

      if (!title || !author) {
        return res.status(400).json({ error: "Title and Author are required" });
      }

      // Check current book copies to update available copies proportionally
      const existingBook = await db.select().from(books).where(eq(books.id, bookId)).limit(1);
      if (existingBook.length === 0) {
        return res.status(404).json({ error: "Book not found" });
      }

      const numCopies = parseInt(copies) || 1;
      const copiesDiff = numCopies - existingBook[0].copies;
      const newAvailable = Math.max(0, existingBook[0].availableCopies + copiesDiff);

      const updatedBook = await db.update(books)
        .set({
          title,
          author,
          isbn: isbn || null,
          category: category || "General",
          description: description || null,
          copies: numCopies,
          availableCopies: newAvailable,
          coverUrl: coverUrl || null,
        })
        .where(eq(books.id, bookId))
        .returning();

      res.json(updatedBook[0]);
    } catch (error) {
      console.error("Failed to update book:", error);
      res.status(500).json({ error: "Failed to update book" });
    }
  });

  // 6. Delete book (Admin only)
  app.delete("/api/books/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: Admin role required" });
      }

      const bookId = parseInt(req.params.id);
      await db.delete(books).where(eq(books.id, bookId));
      res.json({ success: true, message: "Book deleted successfully" });
    } catch (error) {
      console.error("Failed to delete book:", error);
      res.status(500).json({ error: "Failed to delete book" });
    }
  });

  // 7. Get Borrowings
  app.get("/api/borrowings", requireAuth, async (req: AuthRequest, res) => {
    try {
      let records;
      if (req.dbUser.role === 'admin') {
        // Admins see everything
        records = await db.select({
          id: borrowings.id,
          userId: borrowings.userId,
          bookId: borrowings.bookId,
          borrowedAt: borrowings.borrowedAt,
          dueDate: borrowings.dueDate,
          returnedAt: borrowings.returnedAt,
          status: borrowings.status,
          userEmail: users.email,
          userName: users.name,
          bookTitle: books.title,
          bookAuthor: books.author,
          bookCoverUrl: books.coverUrl,
        })
        .from(borrowings)
        .innerJoin(users, eq(borrowings.userId, users.id))
        .innerJoin(books, eq(borrowings.bookId, books.id))
        .orderBy(desc(borrowings.borrowedAt));
      } else {
        // Members see only their own borrowings
        records = await db.select({
          id: borrowings.id,
          userId: borrowings.userId,
          bookId: borrowings.bookId,
          borrowedAt: borrowings.borrowedAt,
          dueDate: borrowings.dueDate,
          returnedAt: borrowings.returnedAt,
          status: borrowings.status,
          userEmail: users.email,
          userName: users.name,
          bookTitle: books.title,
          bookAuthor: books.author,
          bookCoverUrl: books.coverUrl,
        })
        .from(borrowings)
        .innerJoin(users, eq(borrowings.userId, users.id))
        .innerJoin(books, eq(borrowings.bookId, books.id))
        .where(eq(borrowings.userId, req.dbUser.id))
        .orderBy(desc(borrowings.borrowedAt));
      }

      res.json(records);
    } catch (error) {
      console.error("Failed to retrieve borrowings:", error);
      res.status(500).json({ error: "Failed to retrieve borrowings" });
    }
  });

  // 8. Borrow Book
  app.post("/api/borrowings/borrow", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { bookId } = req.body;
      if (!bookId) {
        return res.status(400).json({ error: "bookId is required" });
      }

      const targetBookId = parseInt(bookId);

      // Verify book exists and has available copies
      const bookRecords = await db.select().from(books).where(eq(books.id, targetBookId)).limit(1);
      if (bookRecords.length === 0) {
        return res.status(404).json({ error: "Book not found" });
      }

      const book = bookRecords[0];
      if (book.availableCopies <= 0) {
        return res.status(400).json({ error: "No available copies of this book left to borrow" });
      }

      // Check if user already borrowed this book and has not returned it yet
      const existingBorrow = await db.select()
        .from(borrowings)
        .where(
          and(
            eq(borrowings.userId, req.dbUser.id),
            eq(borrowings.bookId, targetBookId),
            eq(borrowings.status, "borrowed")
          )
        )
        .limit(1);

      if (existingBorrow.length > 0) {
        return res.status(400).json({ error: "You have already borrowed this book and not returned it yet" });
      }

      // Decrement available copies
      await db.update(books)
        .set({ availableCopies: book.availableCopies - 1 })
        .where(eq(books.id, targetBookId));

      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Record borrowing transaction
      const record = await db.insert(borrowings)
        .values({
          userId: req.dbUser.id,
          bookId: targetBookId,
          dueDate: dueDate,
          status: 'borrowed',
        })
        .returning();

      res.status(211).json(record[0]);
    } catch (error) {
      console.error("Failed to borrow book:", error);
      res.status(500).json({ error: "Failed to borrow book" });
    }
  });

  // 9. Return Book
  app.post("/api/borrowings/:id/return", requireAuth, async (req: AuthRequest, res) => {
    try {
      const borrowId = parseInt(req.params.id);

      // Fetch borrowing record
      const borrowRecords = await db.select().from(borrowings).where(eq(borrowings.id, borrowId)).limit(1);
      if (borrowRecords.length === 0) {
        return res.status(404).json({ error: "Borrowing record not found" });
      }

      const record = borrowRecords[0];

      // Verify permissions: only owner of record or admin can return it
      if (record.userId !== req.dbUser.id && req.dbUser.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden: You are not allowed to return this book" });
      }

      if (record.status === 'returned') {
        return res.status(400).json({ error: "This book has already been returned" });
      }

      // Fetch book to increment available copies
      const bookRecords = await db.select().from(books).where(eq(books.id, record.bookId)).limit(1);
      if (bookRecords.length > 0) {
        const book = bookRecords[0];
        await db.update(books)
          .set({ availableCopies: Math.min(book.copies, book.availableCopies + 1) })
          .where(eq(books.id, record.bookId));
      }

      // Update borrowing record
      const updatedRecord = await db.update(borrowings)
        .set({
          returnedAt: new Date(),
          status: 'returned',
        })
        .where(eq(borrowings.id, borrowId))
        .returning();

      res.json(updatedRecord[0]);
    } catch (error) {
      console.error("Failed to return book:", error);
      res.status(500).json({ error: "Failed to return book" });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
