"use client";

import ShelfPage from "@/app/ShelfPage";

export default function ShelfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ShelfPage />
      {children}
    </>
  );
}
