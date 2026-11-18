"use client";

/** Un formular care cere „Sigur?” înainte să plece (ștergeri, blocări). */
export default function FormularConfirmat({
  intrebare,
  children,
  ...rest
}: { intrebare: string; children: React.ReactNode } & Omit<React.ComponentProps<"form">, "onSubmit">) {
  return (
    <form
      {...rest}
      onSubmit={(e) => {
        if (!window.confirm(intrebare)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
