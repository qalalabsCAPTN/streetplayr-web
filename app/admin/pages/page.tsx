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
  const [publishing, setPublishing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'preview'>('preview');

  const handleBlockChange = (updatedBlock: Block) => {
    setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
    setSelectedBlock(updatedBlock);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...blocks];
    const draggedItem = reordered[draggedIndex];
    reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, draggedItem);
    setBlocks(reordered);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || !siteId) return;
    setDraggedIndex(null);

    try {
      const db = getSupabaseClient();
      const orderedIds = blocks.map(b => b.id);
      const { error } = await db.rpc('reorder_page_blocks', {
        p_site_id: siteId,
        p_page_slug: selectedPage,
        p_block_ids: orderedIds,
      });

      if (error) {
        showToast('Error saving block order');
      } else {
        showToast('Block order saved');
        await loadBlocks();
      }
    } catch {
      showToast('Error reordering blocks');
    }
  };

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

  async function publishPage() {
    if (!siteId) return;
    setPublishing(true);
    try {
      const db = getSupabaseClient();
      const { error } = await db.rpc('publish_page_blocks', {
        p_site_id: siteId,
        p_page_slug: selectedPage,
      });

      if (error) {
        showToast('Error publishing page: ' + error.message);
      } else {
        // Trigger on-demand cache revalidation for the storefront homepage routes
        try {
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/home' }),
          });
          await fetch('/api/revalidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '/' }),
          });
        } catch (err) {
          console.error('[Publish Revalidate] on-demand trigger failed:', err);
        }
        showToast('Page published & CDN cache invalidated!');
      }
    } catch (err) {
      showToast('Error publishing page');
    } finally {
      setPublishing(false);
    }
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

            {/* View switcher toggle */}
            <div className="flex items-center bg-base-overlay border border-border rounded-lg p-0.5 ml-4">
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  'px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all',
                  viewMode === 'preview'
                    ? 'bg-nectar-400 text-black shadow'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                Live Preview
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all',
                  viewMode === 'list'
                    ? 'bg-nectar-400 text-black shadow'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                List View
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Atomic Publish button */}
              <button
                onClick={publishPage}
                disabled={publishing || blocks.length === 0}
                className={cn(
                  "btn-secondary text-xs gap-1.5 border-[#ddb7ff]/20 text-[#ddb7ff] hover:bg-[#ddb7ff]/10 hover:text-white shrink-0",
                  (publishing || blocks.length === 0) && "opacity-50 cursor-not-allowed"
                )}
              >
                <Save className="h-3.5 w-3.5" />
                {publishing ? 'Publishing…' : 'Publish Page'}
              </button>

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
          </div>

          {viewMode === 'preview' ? (
            <InteractivePreview
              blocks={blocks}
              selectedBlockId={selectedBlock?.id}
              onSelectBlock={setSelectedBlock}
            />
          ) : (
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
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                      isSelected
                        ? 'border-nectar-400/40 bg-nectar-400/5'
                        : 'border-border bg-base-elevated hover:border-border-strong hover:bg-base-overlay',
                      !block.is_visible && 'opacity-50',
                      draggedIndex === idx && 'border-dashed border-nectar-400/60 opacity-30 bg-base-overlay'
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
          )}
        </div>

        {/* Right: block content editor */}
        <div className="w-[380px] shrink-0 flex flex-col">
          {selectedBlock ? (
            <BlockContentEditor
              key={selectedBlock.id}
              block={selectedBlock}
              onSave={saveBlock}
              onDelete={deleteBlock}
              onChange={handleBlockChange}
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
  onChange,
  saving,
}: {
  block: Block;
  onSave: (b: Block) => void;
  onDelete: (id: string) => void;
  onChange: (b: Block) => void;
  saving: boolean;
}) {
  const content = block.content;
  const isVisible = block.is_visible;

  function setField(key: string, value: unknown) {
    onChange({
      ...block,
      content: { ...block.content, [key]: value },
    });
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
    brand_story: [
      { key: 'heading',    label: 'Heading (HTML/Text)', type: 'text' },
      { key: 'subheading', label: 'Subheading',          type: 'text' },
      { key: 'cta_label',  label: 'CTA Button Label',    type: 'text' },
      { key: 'cta_href',   label: 'CTA Link',            type: 'url' },
      { key: 'video_url',  label: 'Background Video URL', type: 'url' },
    ],
    lookbook: [
      { key: 'title',       label: 'Lookbook Title',     type: 'text' },
      { key: 'description', label: 'Description',        type: 'textarea' },
      { key: 'cta_label',   label: 'CTA Button Label',   type: 'text' },
      { key: 'cta_href',    label: 'CTA Link',           type: 'url' },
      { key: 'image_url',   label: 'Promo Cover Image URL', type: 'url' },
    ],
    reviews: [
      { key: 'heading', label: 'Testimonials Title', type: 'text' },
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
            onClick={() => onChange({ ...block, is_visible: !block.is_visible })}
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

// ── Interactive Preview Sub-component ──────────────────────────

function InteractivePreview({
  blocks,
  selectedBlockId,
  onSelectBlock,
}: {
  blocks: Block[];
  selectedBlockId?: string;
  onSelectBlock: (b: Block) => void;
}) {
  if (!blocks.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-text-muted text-sm">
        No blocks to preview. Add blocks to see them here.
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#120e17] overflow-y-auto p-5 flex justify-center">
      {/* Device wrapper / Browser Window frame */}
      <div className="w-full max-w-4xl bg-[#16111b] border border-white/[0.08] rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col aspect-[16/10] min-h-[500px]">
        {/* Browser header tab bar */}
        <div className="bg-[#1c1622] border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-3 shrink-0 select-none">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex-1 max-w-xs mx-auto bg-base-overlay/40 border border-white/[0.04] rounded-lg py-0.5 px-3 text-[10px] text-text-muted font-mono truncate text-center">
            streetplayr.com/preview
          </div>
        </div>

        {/* Dynamic page container */}
        <div className="flex-1 overflow-y-auto bg-[#16111b] text-[#eadfed] divide-y divide-white/[0.02]">
          {blocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            return (
              <div
                key={block.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(block);
                }}
                className={cn(
                  'relative group cursor-pointer border-2 transition-all',
                  isSelected
                    ? 'border-nectar-400/80 ring-4 ring-nectar-400/10 z-10'
                    : 'border-transparent hover:border-white/10',
                  !block.is_visible && 'opacity-30'
                )}
              >
                {/* Block hover label */}
                <div className="absolute top-2 left-2 z-30 bg-nectar-400 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {block.block_type.replace('_', ' ')}
                </div>

                {/* Actual rendering of block in preview */}
                <PreviewBlockSwitch block={block} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PreviewBlockSwitch({ block }: { block: Block }) {
  const c = block.content as Record<string, any>;

  switch (block.block_type) {
    case 'announcement_bar':
      return (
        <div
          className="w-full py-2 px-4 text-center text-[10px] font-semibold"
          style={{
            backgroundColor: (c.bg_color as string) ?? '#F5A800',
            color: (c.text_color as string) ?? '#000000',
          }}
        >
          {c.text as string || 'FREE SHIPPING ON ORDERS ABOVE ₹999'}
        </div>
      );

    case 'hero':
      return (
        <div
          className="relative min-h-[200px] flex items-center justify-center overflow-hidden bg-base-elevated py-8"
          style={
            Boolean(c.bg_image_url)
              ? { backgroundImage: `url(${c.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : {}
          }
        >
          {Boolean(c.bg_image_url) && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: (c.overlay_opacity as number) ?? 0.4 }}
            />
          )}
          <div className="relative z-10 text-center px-4">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">
              {c.title as string || 'Enter The Play'}
            </h1>
            <p className="text-[10px] text-white/80 max-w-sm mx-auto leading-relaxed">
              {c.subtitle as string || 'Streetwear for the ones who move different.'}
            </p>
            {c.cta_label && (
              <span className="inline-block mt-3 px-4 py-1.5 bg-white text-black text-[9px] font-bold uppercase tracking-wider rounded">
                {c.cta_label as string}
              </span>
            )}
          </div>
        </div>
      );

    case 'text_rich':
      return (
        <div className="max-w-xl mx-auto px-4 py-8 text-center">
          {c.heading && <h3 className="text-sm font-bold mb-2 text-white">{c.heading as string}</h3>}
          <div
            className="text-[11px] text-text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: (c.body_html as string) || 'Rich HTML content goes here.' }}
          />
        </div>
      );

    case 'image_full':
      return (
        <div className="w-full">
          {c.image_url ? (
            <img src={c.image_url as string} alt="" className="w-full h-32 object-cover" />
          ) : (
            <div className="w-full h-24 bg-base-overlay border border-border flex items-center justify-center text-[10px] text-text-muted">
              [Full Width Image]
            </div>
          )}
        </div>
      );

    case 'cta_banner':
      return (
        <div
          className="py-8 px-4 text-center"
          style={{ backgroundColor: (c.bg_color as string) ?? '#111111' }}
        >
          <h3 className="text-sm font-bold text-white mb-1">{c.heading as string || 'CTA Heading'}</h3>
          <p className="text-[10px] text-white/70 mb-4 max-w-xs mx-auto leading-relaxed">{c.subtext as string || 'Description text'}</p>
          {c.cta_label && (
            <span
              className="inline-block px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded"
              style={{
                backgroundColor: (c.accent_color as string) ?? '#F5A800',
                color: '#000000',
              }}
            >
              {c.cta_label as string}
            </span>
          )}
        </div>
      );

    case 'countdown_timer':
      return (
        <div className="py-8 px-4 text-center bg-base-overlay border-y border-border">
          <h3 className="text-xs font-semibold text-text-primary mb-3">{c.heading as string || 'New Drop Countdown'}</h3>
          <div className="flex justify-center gap-4">
            {['Days', 'Hours', 'Mins', 'Secs'].map((unit) => (
              <div key={unit} className="flex flex-col items-center">
                <span className="text-base font-black text-nectar-400">00</span>
                <span className="text-[8px] text-text-muted uppercase tracking-widest">{unit}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'product_carousel':
      return (
        <div className="py-8 px-4 bg-base-surface">
          <h3 className="text-xs font-semibold text-text-primary mb-3">{c.heading as string || 'New Drops'}</h3>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-base-elevated rounded-xl p-2 border border-border flex flex-col justify-end">
                <div className="h-2 w-12 bg-white/10 rounded mb-1" />
                <div className="h-2 w-8 bg-nectar-400/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'collection_grid':
      return (
        <div className="py-8 px-4 bg-base-surface border-t border-border">
          <h3 className="text-xs font-semibold text-text-primary mb-3">{c.heading as string || 'Shop Collections'}</h3>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="aspect-video bg-base-elevated rounded-xl border border-border flex items-center justify-center text-[10px] text-text-muted">
                [Collection Tile]
              </div>
            ))}
          </div>
        </div>
      );

    case 'video_embed':
      return (
        <div className="px-4 py-6">
          <div className="aspect-video bg-black rounded-xl border border-border flex items-center justify-center text-xs text-text-muted">
            🎥 Embedded Video Player
          </div>
        </div>
      );

    case 'spacer':
      return <div style={{ height: `${Math.min(100, (c.height_px as number) ?? 40)}px` }} className="bg-white/[0.02]" />;

    case 'divider':
      return (
        <div className="px-4 py-2">
          <hr
            className="border-t"
            style={{
              borderStyle: (c.style as string) ?? 'solid',
              borderColor: (c.color as string) ?? 'rgba(255,255,255,0.1)',
            }}
          />
        </div>
      );

    case 'brand_story':
      return (
        <div className="py-6 px-4 bg-base-surface border-t border-border">
          <h3 className="text-xs font-semibold text-text-primary mb-2">{c.heading as string || 'Brand Story'}</h3>
          <p className="text-[10px] text-[#ddb7ff]/80">Dynamic Brand Vision & narrative blocks</p>
        </div>
      );

    case 'lookbook':
      return (
        <div className="py-6 px-4 bg-base-surface border-t border-border">
          <h3 className="text-xs font-semibold text-text-primary mb-2">{c.title as string || 'Lookbook Collection'}</h3>
          <p className="text-[10px] text-[#ddb7ff]/80">SS26 Visual Grid Slider</p>
        </div>
      );

    case 'reviews':
      return (
        <div className="py-6 px-4 bg-base-surface border-t border-border">
          <h3 className="text-xs font-semibold text-text-primary mb-2">{c.heading as string || 'What The Streets Say'}</h3>
          <p className="text-[10px] text-[#ddb7ff]/80">Customer Testimonials & Ratings</p>
        </div>
      );

    default:
      return (
        <div className="py-4 text-center text-xs text-text-muted border border-dashed border-border bg-base-elevated">
          [{block.block_type}]
        </div>
      );
  }
}

