// CHK-120 — Responsive lab navigator for the 79-lab workspace (QA #62).
//
// QA cycle 59 found the single flat tab strip unscannable on mobile/tablet:
// offscreen triggers are hard to discover and activate, and the strip is
// visually dense even on desktop. This component adds a grouped, always-
// reachable navigation layer WITHOUT touching the underlying Radix Tabs strip
// (desktop keeps every tab as a real TabsTrigger for accessibility) and
// WITHOUT any calculation changes.
//
// Desktop (>=1024px): a compact "Labs" dropdown menu listing all 80 tabs
// grouped by their classification group (dropdown-menu with submenus).
// Mobile/tablet (<1024px): the dense strip is replaced by the existing
// 6-chip group row (promoted to touch-friendly targets) plus a single
// "All labs" sheet trigger whose contents mirror the desktop menu exactly.
//
// The registry (TAB_REGISTRY / TAB_GROUPS / getWorkspaceTabLabel) remains the
// single source of truth — this component only reads it.

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ListTree, Search, Star, History, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TAB_REGISTRY } from '@/lib/tab-registry';
import { TAB_GROUP_LABELS, groupFor, type TabGroup } from '@/lib/workspace-tab-groups';
import { getWorkspaceTabLabel } from '@/lib/workspace-tab-labels';
import { cn } from '@/lib/utils';

// Group display order — keeps the strip's established visual order.
const GROUP_ORDER: TabGroup[] = ['design', 'fit', 'pricing', 'launch', 'channels', 'business'];

const GROUP_ICONS: Record<TabGroup, string> = {
  design: 'Design & Pattern',
  fit: 'Sizing & Fit',
  pricing: 'Pricing & Income',
  launch: 'Launch & Marketing',
  channels: 'Selling Channels',
  business: 'Business & Community',
};

const GROUPS_ORDER = GROUP_ORDER;

// The registry is static for the lifetime of the bundle. Build the grouped
// navigation model once instead of filtering all labs on every workspace
// render; localized labels are still resolved at render time below.
const GROUPED_TABS = GROUPS_ORDER.map((g) => ({
  group: g,
  entries: TAB_REGISTRY.filter((t) => t.group === g),
}));

export interface TabNavigatorProps {
  /** Currently active tab value. */
  activeTab: string;
  /** Called with the target tab value when the user picks a lab. */
  onTabChange: (value: string) => void;
  /** Current UI language code, used to localize lab labels via the
   *  workspace label catalogue. */
  language: string;
  /** Localized copy — the navigator's visible strings. */
  copy: {
    allLabs: string;
    labsTitle: string;
    labsDescription: string;
    allLabsAriaLabel: string;
    searchPlaceholder: string;
    noResults: string;
    favorites: string;
    recent: string;
    addToFavorites: string;
    removeFromFavorites: string;
  };
  /** List of favorite tab values. */
  favorites?: string[];
  /** List of recently used tab values. */
  recentLabs?: string[];
  /** Called when the user toggles a lab as favorite. */
  onToggleFavorite?: (value: string) => void;
  className?: string;
}

function useViewportWidth() {
  const [isDesktop, setIsDesktop] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

// A single grouped entry — used by both the desktop menu and the mobile sheet
// so the two surfaces can never drift apart.
export function tabGroupsFromRegistry(): { group: TabGroup; entries: typeof TAB_REGISTRY }[] {
  return GROUPED_TABS;
}

export function TabNavigator({ 
  activeTab, 
  onTabChange, 
  language, 
  copy, 
  favorites = [], 
  recentLabs = [], 
  onToggleFavorite, 
  className 
}: TabNavigatorProps) {
  const isDesktop = useViewportWidth();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const groups = tabGroupsFromRegistry();

  const localizedLabel = React.useCallback((value: string, fallback: string) =>
    getWorkspaceTabLabel(language, value, fallback), [language]);

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.map(g => ({
      ...g,
      entries: g.entries.filter(t => 
        localizedLabel(t.value, t.label).toLowerCase().includes(q) ||
        t.value.toLowerCase().includes(q)
      )
    })).filter(g => g.entries.length > 0);
  }, [groups, searchQuery, localizedLabel]);

  const hasResults = filteredGroups.length > 0;

  const handlePick = (value: string) => {
    onTabChange(value);
    // A lab selection is a completed mobile navigation action: close the
    // controlled sheet so its modal overlay cannot block the selected panel.
    setIsSheetOpen(false);
    // Return focus/scroll position predictably: the caller's tab switch
    // scrolls the new panel into view via the existing TabPanel autofocus.
  };

  const labCount = TAB_REGISTRY.length;
  const labsTitle = copy.labsTitle.replace('{{count}}', labCount.toString());
  const allLabsAriaLabel = copy.allLabsAriaLabel.replace('{{count}}', labCount.toString());

  if (!isDesktop) {
    return (
      <div className={className}>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 bg-card border-border text-sm h-11"
              aria-label={allLabsAriaLabel}
              data-testid="tab-navigator-trigger"
            >
              <ListTree className="h-4 w-4" />
              {copy.allLabs}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] flex flex-col p-0 rounded-t-xl overflow-hidden">
            <SheetHeader className="p-4 pb-2 text-left">
              <SheetTitle className="font-serif text-lg">{labsTitle}</SheetTitle>
              <SheetDescription className="text-xs">{copy.labsDescription}</SheetDescription>
            </SheetHeader>

            <div className="px-4 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="pl-9 pr-9 h-11 bg-muted/30 border-border/60 focus-visible:ring-primary/30"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6">
              {!searchQuery && (
                <>
                  {favorites.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-amber-500 border-b border-amber-500/20 mb-2 pb-1">
                        <Star className="h-3 w-3 fill-current" />
                        {copy.favorites}
                      </h3>
                      <ul className="grid grid-cols-1 gap-1">
                        {favorites.map(val => {
                          const tab = TAB_REGISTRY.find(t => t.value === val);
                          if (!tab) return null;
                          const isActive = val === activeTab;
                          return (
                            <li key={val} className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePick(val)}
                                className={cn(
                                  "flex-1 rounded-md px-3 py-3 text-left text-sm transition-colors min-h-[44px]",
                                  isActive ? "bg-primary text-primary-foreground font-medium" : "bg-muted/30 text-foreground hover:bg-muted"
                                )}
                              >
                                {localizedLabel(val, tab.label)}
                              </button>
                              <Button 
                                variant="ghost" size="icon" className="h-11 w-11 shrink-0 text-amber-500"
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(val); }}
                                aria-label={copy.removeFromFavorites}
                              >
                                <Star className="h-4 w-4 fill-current" />
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {recentLabs.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-primary border-b border-border/60 mb-2 pb-1">
                        <History className="h-3 w-3" />
                        {copy.recent}
                      </h3>
                      <ul className="grid grid-cols-2 gap-2">
                        {recentLabs.map(val => {
                          const tab = TAB_REGISTRY.find(t => t.value === val);
                          if (!tab) return null;
                          const isActive = val === activeTab;
                          return (
                            <li key={val}>
                              <button
                                type="button"
                                onClick={() => handlePick(val)}
                                className={cn(
                                  "w-full rounded-md px-3 py-3 text-left text-xs transition-colors min-h-[44px] flex items-center justify-between gap-2",
                                  isActive ? "bg-primary text-primary-foreground font-medium" : "bg-muted/30 text-foreground hover:bg-muted"
                                )}
                              >
                                <span className="truncate">{localizedLabel(val, tab.label)}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {!hasResults ? (
                <div className="py-12 text-center text-muted-foreground animate-in fade-in duration-300">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>{copy.noResults}</p>
                </div>
              ) : (
                filteredGroups.map(({ group, entries }) => (
                  <div key={group} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-primary border-b border-border/60 mb-2 pb-1">
                      {TAB_GROUP_LABELS[group]} ({entries.length})
                    </h3>
                    <ul className="grid grid-cols-1 gap-1">
                      {entries.map((tab) => {
                        const isActive = tab.value === activeTab;
                        const isFav = favorites.includes(tab.value);
                        return (
                          <li key={tab.value} className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handlePick(tab.value)}
                              className={cn(
                                "flex-1 rounded-md px-3 py-3 text-left text-sm transition-colors min-h-[44px]",
                                isActive ? "bg-primary text-primary-foreground font-medium" : "text-foreground hover:bg-muted"
                              )}
                            >
                              {localizedLabel(tab.value, tab.label)}
                            </button>
                            {!searchQuery && (
                              <Button 
                                variant="ghost" size="icon" className={cn("h-11 w-11 shrink-0 transition-colors", isFav ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-500")}
                                onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(tab.value); }}
                                aria-label={isFav ? copy.removeFromFavorites : copy.addToFavorites}
                              >
                                <Star className={cn("h-4 w-4", isFav && "fill-current")} />
                              </Button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <DropdownMenu>
      {/* CHK-123 (QA LIVE-004): the desktop "All Labs" trigger was h-9
          (36px) — below the 44×44px touch-target minimum. */}
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-card border-border h-11 shrink-0"
          aria-label={allLabsAriaLabel}
          data-testid="tab-navigator-trigger"
        >
          <ListTree className="h-4 w-4" />
          {copy.allLabs}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end" className="max-h-[60vh] overflow-y-auto w-64">
          {groups.map(
            ({ group, entries }) =>
              entries.length > 0 && (
                <React.Fragment key={group}>
                  <DropdownMenuSeparator className="first:hidden" />
                  <DropdownMenuSub>
                    {/* CHK-123 (QA LIVE-004): group SubTriggers measured 28px live —
                        below the 44×44px touch-target minimum. min-h-[44px] fixes it. */}
                    <DropdownMenuSubTrigger className="text-xs min-h-[44px]">
                      {TAB_GROUP_LABELS[group]} ({entries.length})
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      {entries.map((tab) => (
                        // CHK-123 (QA LIVE-004): shadcn dropdown items are h-9
                        // (36px) — below the 44×44px touch-target minimum.
                        // min-h-[44px] raises the hit area without adding visible
                        // density (the desktop menu is pointer-first anyway).
                        <DropdownMenuItem
                          key={tab.value}
                          onSelect={() => handlePick(tab.value)}
                          className="text-sm min-h-[44px]"
                          data-testid={`tab-navigator-item-${tab.value}`}
                        >
                          {localizedLabel(tab.value, tab.label)}
                          {tab.value === activeTab && (
                            <span className="ml-auto text-[10px] font-semibold text-primary">✓</span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </React.Fragment>
              ),
          )}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

