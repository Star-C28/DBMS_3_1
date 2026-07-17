export interface User {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  role: 'admin' | 'member';
  createdAt: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  category: string;
  description: string | null;
  copies: number;
  availableCopies: number;
  coverUrl: string | null;
  createdAt: string;
}

export interface Borrowing {
  id: number;
  userId: number;
  bookId: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: 'borrowed' | 'returned';
  userEmail?: string;
  userName?: string | null;
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string | null;
}
