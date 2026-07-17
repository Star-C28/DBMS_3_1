import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID to local user details and role)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('member').notNull(), // 'admin' or 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Books table
export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  isbn: text('isbn'),
  category: text('category'),
  description: text('description'),
  copies: integer('copies').default(1).notNull(),
  availableCopies: integer('available_copies').default(1).notNull(),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Borrowings table
export const borrowings = pgTable('borrowings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: integer('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  borrowedAt: timestamp('borrowed_at').defaultNow().notNull(),
  dueDate: timestamp('due_date').notNull(),
  returnedAt: timestamp('returned_at'),
  status: text('status').default('borrowed').notNull(), // 'borrowed' or 'returned'
});

// Relations definitions for Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  borrowings: many(borrowings),
}));

export const booksRelations = relations(books, ({ many }) => ({
  borrowings: many(borrowings),
}));

export const borrowingsRelations = relations(borrowings, ({ one }) => ({
  user: one(users, {
    fields: [borrowings.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [borrowings.bookId],
    references: [books.id],
  }),
}));
