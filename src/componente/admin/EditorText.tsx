"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { micsoreaza } from "@/componente/admin/MicsoreazaPoza";
import { adresaVideo, esteHtml, semneInHtml, textSimplu } from "@/lib/text-bogat";

/**
 * Editorul de text din panou: se scrie ca într-un document, iar bara de sus
 * pune îngroșat, culoare, link, subtitlu, listă, poză în text și filmare de
 * pe YouTube sau Facebook.
 *
 * Asociația, 11 noiembrie 2026: „un editor sus, să pună un link, să
 * evidențieze ceva”, „să adauge poză în text, video”. Varianta de dinainte
 * scria semne în text (`**așa**`, `## `) — omul le vedea și nu înțelegea.
 *
 * Ce se salvează e HTML, într-un câmp ascuns cu numele dat. Serverul îl
 * curăță (`lib/curata-html.ts`) și la salvare, și la afișare: ce nu poate
 * face bara de aici nu ajunge pe site, oricum ar fi trimis.
 */

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-video]",
        getAttrs: (el) => ({ src: (el as HTMLElement).querySelector("iframe")?.getAttribute("src") }),
      },
      { tag: "iframe[src]", getAttrs: (el) => ({ src: (el as HTMLElement).getAttribute("src") }) },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      { "data-video": "" },
      [
        "iframe",
        mergeAttributes({
          src: HTMLAttributes.src,
          allowfullscreen: "true",
          loading: "lazy",
          title: "Filmare",
        }),
      ],
    ];
  },
});

const CULORI = [
  { nume: "Portocaliu", cod: "#e03a0f" },
  { nume: "Roșu închis", cod: "#93250e" },
  { nume: "Turcoaz", cod: "#227f85" },
  { nume: "Gri", cod: "#6b6b6b" },
];

function Buton({
  activ,
  onClick,
  children,
  titlu,
  dezactivat,
}: {
  activ?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  titlu: string;
  dezactivat?: boolean;
}) {
  return (
    <button
      type="button"
      title={titlu}
      aria-label={titlu}
      aria-pressed={activ}
      disabled={dezactivat}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`min-h-9 min-w-9 rounded-moale px-2.5 py-1.5 text-mic font-semibold transition-colors disabled:opacity-40 ${
        activ ? "bg-cerneala text-hartie" : "text-cerneala hover:bg-hartie-umbra"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <span aria-hidden className="mx-1 h-6 w-px self-center bg-hartie-umbra" />;
}

function Bara({ editor, puneStare }: { editor: Editor; puneStare: (s: string) => void }) {
  const fisier = useRef<HTMLInputElement>(null);
  const [culori, setCulori] = useState(false);
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      ul: e.isActive("bulletList"),
      ol: e.isActive("orderedList"),
      citat: e.isActive("blockquote"),
      link: e.isActive("link"),
      culoare: (e.getAttributes("textStyle").color as string | undefined) ?? null,
      inapoi: e.can().undo(),
      inainte: e.can().redo(),
    }),
  });

  function link() {
    if (s.link) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const scris = window.prompt("Lipește adresa linkului (de ex. teona-ariana.ro/doneaza):");
    if (!scris?.trim()) return;
    let adresa = scris.trim();
    if (!/^(https?:\/\/|\/|mailto:|tel:)/i.test(adresa)) {
      adresa = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresa) ? `mailto:${adresa}` : `https://${adresa}`;
    }
    const { empty } = editor.state.selection;
    if (empty) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: scris.trim(), marks: [{ type: "link", attrs: { href: adresa } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: adresa }).run();
    }
  }

  function video() {
    const scris = window.prompt("Lipește linkul filmării de pe YouTube sau Facebook:");
    if (!scris?.trim()) return;
    const src = adresaVideo(scris);
    if (!src) {
      puneStare("Linkul nu e de pe YouTube sau Facebook. Copiază-l din bara de adrese a filmării.");
      return;
    }
    editor.chain().focus().insertContent([{ type: "video", attrs: { src } }, { type: "paragraph" }]).run();
    puneStare("");
  }

  async function poza(f: File) {
    puneStare("Se urcă poza…");
    try {
      const mica = (await micsoreaza(f)) ?? f;
      const corp = new FormData();
      corp.append("poza", mica);
      const r = await fetch("/api/admin/poza-in-text", { method: "POST", body: corp });
      const date = (await r.json().catch(() => ({}))) as { adresa?: string; mesaj?: string };
      if (!r.ok || !date.adresa) {
        puneStare(date.mesaj ?? (r.status === 403 ? "Ai ieșit din panou. Intră din nou și încearcă." : "Poza n-a putut fi urcată. Încearcă din nou."));
        return;
      }
      const titlu = (document.querySelector('[name="titlu"]') as HTMLInputElement | null)?.value?.trim();
      editor
        .chain()
        .focus()
        .insertContent([{ type: "image", attrs: { src: date.adresa, alt: titlu || "Fotografie" } }, { type: "paragraph" }])
        .run();
      puneStare("");
    } catch (e) {
      puneStare(`Poza n-a putut fi urcată: ${(e as Error).message}`);
    }
  }

  return (
    <div
      role="toolbar"
      aria-label="Formatarea textului"
      className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-t-moale border border-b-0 border-hartie-umbra bg-hartie-umbra/40 p-1.5 backdrop-blur"
    >
      <Buton titlu="Îngroșat" activ={s.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Buton>
      <Buton titlu="Cursiv" activ={s.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Buton>
      <Buton titlu="Subliniat" activ={s.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Buton>
      <div className="relative">
        <Buton titlu="Culoare" activ={Boolean(s.culoare)} onClick={() => setCulori((c) => !c)}>
          <span className="flex items-center gap-1">
            <span aria-hidden className="inline-block size-3.5 rounded-full border border-cerneala/20" style={{ background: s.culoare ?? "#232323" }} />
            Culoare
          </span>
        </Buton>
        {culori && (
          <div className="absolute left-0 top-full z-30 mt-1 grid w-44 gap-1 rounded-moale border border-hartie-umbra bg-hartie p-2 shadow-lg">
            {CULORI.map((c) => (
              <button
                key={c.cod}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setColor(c.cod).run();
                  setCulori(false);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-mic hover:bg-hartie-umbra"
              >
                <span aria-hidden className="inline-block size-4 rounded-full" style={{ background: c.cod }} />
                <span style={{ color: c.cod }} className="font-semibold">{c.nume}</span>
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setCulori(false);
              }}
              className="rounded px-2 py-1.5 text-left text-mic hover:bg-hartie-umbra"
            >
              Fără culoare
            </button>
          </div>
        )}
      </div>
      <Separator />
      <Buton titlu="Titlu de secțiune" activ={s.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        Titlu
      </Buton>
      <Buton titlu="Subtitlu mic" activ={s.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        Subtitlu
      </Buton>
      <Buton titlu="Listă cu puncte" activ={s.ul} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • Listă
      </Buton>
      <Buton titlu="Listă numerotată" activ={s.ol} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. Listă
      </Buton>
      <Buton titlu="Citat" activ={s.citat} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        „Citat”
      </Buton>
      <Separator />
      <Buton titlu={s.link ? "Scoate linkul" : "Link"} activ={s.link} onClick={link}>
        {s.link ? "Scoate linkul" : "Link"}
      </Buton>
      <Buton titlu="Poză în text" onClick={() => fisier.current?.click()}>
        Poză
      </Buton>
      <Buton titlu="Video de pe YouTube sau Facebook" onClick={video}>
        Video
      </Buton>
      <Separator />
      <Buton titlu="Anulează" dezactivat={!s.inapoi} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </Buton>
      <Buton titlu="Refă" dezactivat={!s.inainte} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </Buton>
      <input
        ref={fisier}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        data-fara-micsorare
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void poza(f);
        }}
      />
    </div>
  );
}

export default function EditorText({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const camp = useRef<HTMLTextAreaElement>(null);
  const [stare, setStare] = useState("");
  const initial = esteHtml(defaultValue) ? defaultValue : semneInHtml(defaultValue);

  const scrie = (html: string) => {
    const c = camp.current;
    if (!c) return;
    c.value = textSimplu(html).length ? html : "";
    // Pentru `TineCiorna`: textul nesalvat rămâne în filă.
    c.dispatchEvent(new CustomEvent("input", { bubbles: true, detail: "editor" }));
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextStyle,
      Color,
      Image.configure({ allowBase64: false }),
      Video,
    ],
    content: initial,
    editorProps: {
      attributes: {
        class: "text-bogat min-h-80 rounded-b-moale border border-hartie-umbra bg-hartie px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-turcoaz-500",
        "aria-label": "Textul",
        "data-editor": "",
      },
    },
    onUpdate: ({ editor: e }) => scrie(e.getHTML()),
  });

  useEffect(() => {
    const c = camp.current;
    if (!editor || !c) return;
    // Textul pus din afară: ciorna scrisă de asistent, sau cea ținută în filă
    // de `TineCiorna` după o sesiune expirată.
    const dinAfara = (e: Event) => {
      if ((e as CustomEvent).detail === "editor") return;
      const v = c.value;
      editor.commands.setContent(esteHtml(v) ? v : semneInHtml(v), { emitUpdate: false });
    };
    c.addEventListener("input", dinAfara);
    const t = window.setTimeout(() => {
      if (c.value && c.value !== initial && c.value !== editor.getHTML()) {
        editor.commands.setContent(esteHtml(c.value) ? c.value : semneInHtml(c.value), { emitUpdate: false });
      }
    }, 60);
    // Textul prea scurt se spune înainte de trimitere, nu după o pagină de eroare.
    const form = c.form;
    const laTrimitere = (e: SubmitEvent) => {
      const btn = e.submitter as HTMLButtonElement | null;
      if (btn?.name === "actiune" && btn.value === "sterge") return;
      if (textSimplu(editor.getHTML()).join(" ").length < 20) {
        e.preventDefault();
        setStare("Scrie textul: cel puțin câteva fraze.");
        editor.commands.focus();
      }
    };
    form?.addEventListener("submit", laTrimitere);
    return () => {
      c.removeEventListener("input", dinAfara);
      window.clearTimeout(t);
      form?.removeEventListener("submit", laTrimitere);
    };
  }, [editor, initial]);

  return (
    <div className="grid">
      <textarea
        ref={camp}
        name={name}
        defaultValue={textSimplu(initial).length ? initial : ""}
        hidden
        readOnly
      />
      {editor ? (
        <>
          <Bara editor={editor} puneStare={setStare} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <div className="min-h-80 rounded-moale border border-hartie-umbra bg-hartie px-5 py-4 text-cerneala-slab">
          Se pregătește editorul…
        </div>
      )}
      {stare && (
        <p role="status" className="mt-2 text-mic font-semibold text-caramiziu-800">
          {stare}
        </p>
      )}
    </div>
  );
}
