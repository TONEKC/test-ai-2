import bcrypt from "bcryptjs";
import { BookCategory, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const librarianEmail = (
    process.env.LIBRARIAN_EMAIL ?? "admin@library.local"
  ).toLowerCase();
  const librarianPassword =
    process.env.LIBRARIAN_PASSWORD ?? "library-admin-123";
  const librarianName = process.env.LIBRARIAN_NAME ?? "Library Admin";

  const passwordHash = await bcrypt.hash(librarianPassword, 12);

  await prisma.user.upsert({
    where: { email: librarianEmail },
    update: {
      name: librarianName,
      password: passwordHash,
      phone: "-",
      role: UserRole.LIBRARIAN,
    },
    create: {
      name: librarianName,
      email: librarianEmail,
      phone: "-",
      password: passwordHash,
      role: UserRole.LIBRARIAN,
    },
  });

  const books = [
    {
      title: "Database System Concepts",
      author: "Abraham Silberschatz",
      category: BookCategory.TEXTBOOK,
      total_copies: 4,
      available_copies: 4,
    },
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      category: BookCategory.TEXTBOOK,
      total_copies: 3,
      available_copies: 3,
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      category: BookCategory.GENERAL,
      total_copies: 5,
      available_copies: 5,
    },
    {
      title: "The Psychology of Money",
      author: "Morgan Housel",
      category: BookCategory.GENERAL,
      total_copies: 4,
      available_copies: 4,
    },
    {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      category: BookCategory.NOVEL,
      total_copies: 6,
      available_copies: 6,
    },
  ];

  for (const book of books) {
    await prisma.book.upsert({
      where: {
        title_author: {
          title: book.title,
          author: book.author,
        },
      },
      update: book,
      create: book,
    });
  }

  console.log("Seed completed: librarian user and 5 books are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
