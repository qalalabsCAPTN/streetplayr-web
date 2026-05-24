'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, EyeOff, Trash2, GripVertical, ChevronDown, ChevronRight, Save, ExternalLink } from 'lucide-react';
import { TopBar } from '@/components/ops2/top-bar';
import { cn } from '@/lib/ops2/cn';
import { usePlatformStore } from '@/stores/ops2/platform-store';
import { getSupabaseClient } from '@/lib/ops2/supabase';
import type { BlockType } from '@/lib/page-editor/get-page-blocks';

// ============================================================
// Admin Page Editor — /admin/pages
// Lists pages per site. Click page → edit its blocks.
// ============================================================

const PAGES = [
  { slug: 'home',        label: 'Home',        path: '/' },
  { slug: 'about',       label: 'About',       path: '/about' },
  { slug: 'shop',        label: 'Shop',        path: '/shop' },
  { slug: 'collections', label: 'Collections', path: '/collections' },
  { slug: 'journal',     label: 'Journal',     path: '/journal' },
];

const BLOCK_TYPES: { type: BlockType; label: string; icon: string; description: string }[] = [
  { type: 'announcement_bar', label: 'Announcement Bar', icon: '📢', description: 'Top banner with text + optional link' },
  { type: 'hero',             label: 'Hero',             icon: '🖼',  description: 'Full-width hero with title, subtitle, CTA' },
  { type: 'text_rich',        label: 'Rich Text',        icon: '📝',  description: 'Heading + body HTML content' },
  { type: 'image_full',       label: 'Full Image',       icon: '🏞',  description: 'Edge-to-edge image with optional link' },
  { type: 'image_grid',       label: 'Image Grid',       icon: '🔲',  description: 'Multi-image grid' },
  { type: 'cta_banner',       label: 'CTA Banner',       icon: '🎯',  description: 'Coloured call-to-action section' },
  { type: 'countdown_timer',  label: 'Countdown',        icon: '⏱',  description: 'Live countdown to a target date' },
  { type: 'product_carousel', label: 'Product Carousel', icon: '🛍',  description: 'Dynamic product row by tag or IDs' },
  { type: 'collection_grid',  label: 'Collection Grid',  icon: '📦',  description: 'Grid of collection tiles' },
  { type: 'video_embed',      label: 'Video',            icon: '🎬',  description: 'Embedded video (URL)' },
  { type: 'spacer',           label: 'Spacer',           icon: '↕',  description: 'Empty vertical space' },
  { type: 'divider',          label: 'Divider',          icon: '—',  description: 'Horizontal rule' },
];

interface Block {
  id: string;
  block_type: BlockType;
  content: Record<string, unknown>;
  block_order: number;
  is_visible: boolean;
}

export default function PagesEditorPage() {
  const { activePlatformId, allPlatforms } = usePlatformStore();
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Resolve siteId for active platform
  useEffect(() => {
    const db = getSupabaseClient();
    const slug = activePlatformId === 'all' ? 'streetplayr' : activePlatformId;
    db.from('sites').select('id').eq('slug', slug).single().then(({ data }) => {
      setSiteId(data?.id ?? null);
    });
  }, [activePlatformId]);

  // Load blocks for selected page
  const loadBlocks = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    const db = getSupabaseClient();
    const { data } = await db
      .from('page_blocks')
      .select('id, block_type, content, block_order, is_visible')
      .eq('site_id', siteId)
      .eq('page_slug', selectedPage)
      .order('block_order', { ascending: true });
    setBlocks((data as Block[]) ?? []);
    setSelectedBlock(null);
    setLoading(false);
  }, [siteId, selectedPage]);

  useEffect(() => { loadBlocks(); }, [loadBlocks]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function addBlock(type: BlockType) {
    if (!siteId) return;
    const db = getSupabaseClient();
    const nextOrder = blocks.length > 0 ? Math.max(...blocks.map(b => b.block_order)) + 1 : 0;
    const { data, error } = await db
      .from('page_blocks')
      .insert({ site_id: siteId, page_slug: selectedPage, block_type: type, content: {}, block_order: nextOrder })
      .select()
      .single();
    if (!error && data) {
      await loadBlocks();
      setSelectedBlock(data as Block);
      showToast('Block added');
    }
    setShowAddMenu(false);
  }

  async function saveBlock(block: Block) {
    setSaving(true);
    const db = getSupabaseClient();
    await db.from('page_blocks').update({ content: block.content, is_visible: block.is_visible }).eq('id', block.id);
    await loadBlocks();
    setSaving(false);
    showToast('Saved');
  }

  async function deleteBlock(id: string) {
    const db = getSupabaseClient();
    await db.from('page_blocks').delete().eq('id', id);
    setSelectedBlock(null);
    await loadBlocks();
    showToast('Block deleted');
  }

  async function toggleVisible(block: Block) {
    const db = getSupabaseClient();
    await db.from('page_blocks').update({ is_visible: !block.is_visible }).eq('id', block.id);
    await loadBlocks();
  }

  const activeSiteName = activePlatformId === 'all'
    ? 'StreetPlayR'
    : allPlatforms.find(p => p.id === activePlatformId)?.label ?? activePlatformId;

  return (
    <div className="flex flex-col h-screen">
      <TopBar title="Page Editor" />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-nectar-400 text-black text-sm font-semibold px-4 py-2 rounded-lg shadow-lg animate-slide-in-up">
          {toast}
        </div>
      )}

      <div className="flex flex-1 pt-14 min-h-0">
        {/* Left: page list */}
        <aside className="w-[220px] shrink-0 border-r border-border bg-base-surface flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-1">Site</div>
            <div className="text-sm font-semibold text-nectar-400">{activeSiteName}</div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-text-muted px-2 mb-1">Pages</div>
            {PAGES.map(p => (
              <button
                key={p.slug}
                onClick={() => setSelectedPage(p.slug)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedPage === p.slug
                    ? 'bg-nectar-400/10 text-nectar-400 font-medium'
                    : 'text-text-secondary hover:bg-base-elevated hover:text-text-primary'
                )}
              >
                <span>{p.label}</span>
                <a
                  href={p.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </button>
            ))}
          </div>
        </aside>

        {/* Centre: block list */}
        <div className="flex-1 flex flex-col border-r border-border min-w-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <span className="text-sm font-semibold text-text-primary capitalize">{selectedPage}</span>
              <span className="text-xs text-text-muted ml-2">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="btn-primary text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Block
              </button>
              {showAddMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-72 bg-base-elevated border border-border rounded-xl shadow-overlay overflow-hidden animate-slide-in-up">
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {BLOCK_TYPES.map(bt => (
                        <button
                          key={bt.type}
                          onClick={() => addBlock(bt.type)}
                          className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-base-overlay transition-colors text-left"
                        >
                          <span className="text-lg shrink-0 mt-0.5">{bt.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{bt.label}</div>
                            <div className="text-xs text-text-muted">{bt.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading && (
              <div className="text-center py-12 text-text-muted text-sm">Loading blocks…</div>
            )}
            {!loading && blocks.length === 0 && (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <div className="text-3xl mb-3">📄</div>
                <p className="text-sm text-text-muted">No blocks yet.</p>
                <p className="text-xs text-text-muted mt-1">Click "Add Block" to start building this page.</p>
              </div>
            )}
            {blocks.map((block, idx) => {
              const bt = BLOCK_TYPES.find(b => b.type === block.block_type);
              const isSelected = selectedBlock?.id === block.id;
              return (
                <div
                  key={block.id}
                  onClick={() => setSelectedBlock(block)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                    isSelected
                      ? 'border-nectar-400/40 bg-nectar-400/5'
                      : 'border-border bg-base-elevated hover:border-border-strong hover:bg-base-overlay',
                    !block.is_visible && 'opacity-50'
                  )}
                >
                  <GripVertical className="h-4 w-4 text-text-muted shrink-0 cursor-grab" />
                  <span className="text-base shrink-0">{bt?.icon ?? '□'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary">{bt?.label ?? block.block_type}</div>
                    <div className="text-xs text-text-muted truncate">
                      {block.content.title as string
                        || block.content.text as string
                        || block.content.heading as string
                        || 'No content yet'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-text-muted">#{idx + 1}</span>
                    <button
                      onClick={e => { e.stopPropagation(); toggleVisible(block); }}
                      className="p-1 rounded hover:bg-base-overlay text-text-muted hover:text-text-secondary"
                    >
                      {block.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    {isSelected && <ChevronRight className="h-3.5 w-3.5 text-nectar-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: block content editor */}
        <div className="w-[380px] shrink-0 flex flex-col">
          {selectedBlock ? (
            <BlockContentEditor
              key={selectedBlock.id}
              block={selectedBlock}
              onSave={saveBlock}
              onDelete={deleteBlock}
              saving={saving}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="text-3xl mb-3">✏️</div>
                <p className="text-sm text-text-muted">Select a block to edit its content</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Block content editor ──────────────────────────────────────

function BlockContentEditor({
  block,
  onSave,
  onDelete,
  saving,
}: {
  block: Block;
  onSave: (b: Block) => void;
  onDelete: (id: string) => void;
  saving: boolean;
}) {
  const [content, setContent] = useState<Record<string, unknown>>(block.content);
  const [isVisible, setIsVisible] = useState(block.is_visible);

  function setField(key: string, value: unknown) {
    setContent(c => ({ ...c, [key]: value }));
  }

  const FIELDS: Record<BlockType, { key: string; label: string; type: 'text' | 'textarea' | 'url' | 'color' | 'number' | 'toggle' }[]> = {
    announcement_bar:  [
      { key: 'text',          label: 'Text',          type: 'text' },
      { key: 'bg_color',      label: 'Background',    type: 'color' },
      { key: 'text_color',    label: 'Text Color',    type: 'color' },
      { key: 'link_href',     label: 'Link URL',      type: 'url' },
      { key: 'link_label',    label: 'Link Label',    type: 'text' },
      { key: 'is_dismissible',label: 'Dismissible',   type: 'toggle' },
    ],
    hero: [
      { key: 'title',           label: 'Title',           type: 'text' },
      { key: 'subtitle',        label: 'Subtitle',        type: 'textarea' },
      { key: 'cta_label',       label: 'CTA Label',       type: 'text' },
      { key: 'cta_href',        label: 'CTA Link',        type: 'url' },
      { key: 'bg_image_url',    label: 'Background Image URL', type: 'url' },
      { key: 'overlay_opacity', label: 'Overlay Opacity (0–1)', type: 'number' },
    ],
    text_rich: [
      { key: 'heading',   label: 'Heading',   type: 'text' },
      { key: 'body_html', label: 'Body HTML', type: 'textarea' },
    ],
    image_full: [
      { key: 'image_url', label: 'Image URL', type: 'url' },
      { key: 'alt_text',  label: 'Alt Text',  type: 'text' },
      { key: 'link_href', label: 'Link URL',  type: 'url' },
      { key: 'caption',   label: 'Caption',   type: 'text' },
    ],
    image_grid: [
      { key: 'columns', label: 'Columns (2–4)', type: 'number' },
    ],
    cta_banner: [
      { key: 'heading',      label: 'Heading',       type: 'text' },
      { key: 'subtext',      label: 'Subtext',       type: 'textarea' },
      { key: 'cta_label',    label: 'CTA Label',     type: 'text' },
      { key: 'cta_href',     label: 'CTA Link',      type: 'url' },
      { key: 'bg_color',     label: 'Background',    type: 'color' },
      { key: 'accent_color', label: 'Button Color',  type: 'color' },
    ],
    countdown_timer: [
      { key: 'heading',          label: 'Heading',         type: 'text' },
      { key: 'target_datetime',  label: 'Target Date/Time (ISO)', type: 'text' },
      { key: 'cta_label',        label: 'CTA Label',       type: 'text' },
      { key: 'cta_href',         label: 'CTA Link',        type: 'url' },
    ],
    product_carousel: [
      { key: 'heading', label: 'Heading',    type: 'text' },
      { key: 'tag',     label: 'Product Tag', type: 'text' },
    ],
    collection_grid: [
      { key: 'heading', label: 'Heading', type: 'text' },
    ],
    video_embed: [
      { key: 'url',          label: 'Video URL',     type: 'url' },
      { key: 'aspect_ratio', label: 'Aspect Ratio',  type: 'text' },
    ],
    spacer:  [{ key: 'height_px', label: 'Height (px)', type: 'number' }],
    divider: [
      { key: 'style', label: 'Style (solid/dashed)', type: 'text' },
      { key: 'color', label: 'Color',                type: 'color' },
    ],
  };

  const fields = FIELDS[block.block_type] ?? [];
  const bt = BLOCK_TYPES.find(b => b.type === block.block_type);

  return (
    <div className="flex flex-col h-full border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{bt?.icon}</span>
          <span className="text-sm font-semibold text-text-primary">{bt?.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(block.id)}
            className="btn-ghost text-xs text-status-error hover:bg-status-error/10 gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSave({ ...block, content, is_visible: isVisible })}
            disabled={saving}
            className="btn-primary text-xs gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Visibility toggle */}
        <div className="flex items-center justify-between bg-base-elevated rounded-lg px-4 py-3">
          <span className="text-sm text-text-primary">Visible on page</span>
          <button
            onClick={() => setIsVisible(v => !v)}
            className={cn(
              'relative w-10 h-5 rounded-full transition-colors',
              isVisible ? 'bg-nectar-400' : 'bg-base-overlay border border-border'
            )}
          >
            <span className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
              isVisible ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </button>
        </div>

        {/* Content fields */}
        {fields.map(field => (
          <div key={field.key}>
            <label className="text-xs text-text-muted mb-1.5 block">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                className="field w-full text-sm font-mono resize-none h-28"
                value={(content[field.key] as string) ?? ''}
                onChange={e => setField(field.key, e.target.value)}
              />
            ) : field.type === 'toggle' ? (
              <button
                onClick={() => setField(field.key, !(content[field.key] as boolean))}
                className={cn(
                  'relative w-10 h-5 rounded-full transition-colors',
                  content[field.key] ? 'bg-nectar-400' : 'bg-base-overlay border border-border'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  content[field.key] ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </button>
            ) : (
              <input
                type={field.type === 'color' ? 'color' : field.type === 'number' ? 'number' : 'text'}
                className={cn('field w-full text-sm', field.type === 'color' && 'h-10 p-1 cursor-pointer')}
                value={(content[field.key] as string | number) ?? ''}
                onChange={e => setField(
                  field.key,
                  field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                )}
                placeholder={field.type === 'url' ? 'https://...' : ''}
              />
            )}
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            No editable fields for this block type yet.
          </div>
        )}
      </div>
    </div>
  );
}

// Helper reference to BLOCK_TYPES for BlockContentEditor
const BLOCK_TYPES = [
  { type: 'announcement_bar' as BlockType, label: 'Announcement Bar', icon: '📢', description: '' },
  { type: 'hero'             as BlockType, label: 'Hero',             icon: '🖼',  description: '' },
  { type: 'text_rich'        as BlockType, label: 'Rich Text',        icon: '📝',  description: '' },
  { type: 'image_full'       as BlockType, label: 'Full Image',       icon: '🏞',  description: '' },
  { type: 'image_grid'       as BlockType, label: 'Image Grid',       icon: '🔲',  description: '' },
  { type: 'cta_banner'       as BlockType, label: 'CTA Banner',       icon: '🎯',  description: '' },
  { type: 'countdown_timer'  as BlockType, label: 'Countdown',        icon: '⏱',  description: '' },
  { type: 'product_carousel' as BlockType, label: 'Product Carousel', icon: '🛍',  description: '' },
  { type: 'collection_grid'  as BlockType, label: 'Collection Grid',  icon: '📦',  description: '' },
  { type: 'video_embed'      as BlockType, label: 'Video',            icon: '🎬',  description: '' },
  { type: 'spacer'           as BlockType, label: 'Spacer',           icon: '↕',  description: '' },
  { type: 'divider'          as BlockType, label: 'Divider',          icon: '—',  description: '' },
];
