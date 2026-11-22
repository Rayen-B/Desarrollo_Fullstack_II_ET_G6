import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import { descripcionAHtml } from '../../utils/descripcion';
import '../../assets/css/editor.css';

export const MAX_DESCRIPCION = 500;

const BOTONES = [
  { clave: 'negrita', icono: 'ti-bold', titulo: 'Negrita', activo: (e) => e.isActive('bold'), accion: (e) => e.chain().focus().toggleBold().run() },
  { clave: 'cursiva', icono: 'ti-italic', titulo: 'Cursiva', activo: (e) => e.isActive('italic'), accion: (e) => e.chain().focus().toggleItalic().run() },
  { clave: 'titulo', icono: 'ti-heading', titulo: 'Título', activo: (e) => e.isActive('heading', { level: 3 }), accion: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { clave: 'lista', icono: 'ti-list', titulo: 'Lista con viñetas', activo: (e) => e.isActive('bulletList'), accion: (e) => e.chain().focus().toggleBulletList().run() },
  { clave: 'numerada', icono: 'ti-list-numbers', titulo: 'Lista numerada', activo: (e) => e.isActive('orderedList'), accion: (e) => e.chain().focus().toggleOrderedList().run() },
  { clave: 'cita', icono: 'ti-quote', titulo: 'Cita', activo: (e) => e.isActive('blockquote'), accion: (e) => e.chain().focus().toggleBlockquote().run() },
  { clave: 'deshacer', icono: 'ti-arrow-back-up', titulo: 'Deshacer', activo: () => false, accion: (e) => e.chain().focus().undo().run() },
  { clave: 'rehacer', icono: 'ti-arrow-forward-up', titulo: 'Rehacer', activo: () => false, accion: (e) => e.chain().focus().redo().run() }
];

// Editor de texto enriquecido para la descripción del producto.
// Solo ofrece (y el servidor solo acepta) negrita, cursiva, título, listas y cita.
// valor / onCambio trabajan con HTML; si el editor queda vacío entrega '' (no "<p></p>").
export default function EditorDescripcion({ valor, onCambio, id = 'descripcion' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false
      }),
      CharacterCount.configure({ limit: MAX_DESCRIPCION })
    ],
    content: descripcionAHtml(valor),
    editorProps: {
      attributes: { id, role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Descripción del producto' }
    },
    onUpdate: ({ editor: ed }) => onCambio(ed.isEmpty ? '' : ed.getHTML())
  });

  // Si el formulario cambia el valor desde fuera (por ejemplo al limpiarse tras guardar), el editor lo sigue
  useEffect(() => {
    if (!editor) return;
    const actual = editor.isEmpty ? '' : editor.getHTML();
    if ((valor || '') !== actual && !editor.isFocused) {
      editor.commands.setContent(descripcionAHtml(valor), false);
    }
  }, [valor, editor]);

  if (!editor) return null;
  const caracteres = editor.storage.characterCount.characters();

  return (
    <div>
      <div className="editor-descripcion-caja">
        <div className="editor-descripcion-barra" role="toolbar" aria-label="Formato de la descripción">
          {BOTONES.map((b) => (
            <button
              key={b.clave}
              type="button"
              className={'btn btn-sm btn-outline-secondary' + (b.activo(editor) ? ' activo' : '')}
              title={b.titulo}
              aria-label={b.titulo}
              aria-pressed={b.activo(editor)}
              onClick={() => b.accion(editor)}
            >
              <i className={`ti ${b.icono}`} aria-hidden="true"></i>
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
      </div>
      <div className="d-flex justify-content-between form-text small">
        <span>Opcional. Negrita, cursiva, títulos, listas y citas.</span>
        <span id="contador-desc">{caracteres} / {MAX_DESCRIPCION} caracteres</span>
      </div>
    </div>
  );
}
