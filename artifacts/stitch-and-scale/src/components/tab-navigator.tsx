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
import { ListTree } from 'lucide-react';
import { TAB_REGISTRY } from '@/lib/tab-registry';
import { TAB_GROUP_LABELS, groupFor, type TabGroup } from '@/lib/workspace-tab-groups';
import { getWorkspaceTabLabel } from '@/lib/workspace-tab-labels';

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

export interface TabNavigatorProps {
  /** Currently active tab value. */
  activeTab: string;
  /** Called with the target tab value when the user picks a lab. */
  onTabChange: (value: string) => void;
  /** Current UI language code, used to localize lab labels via the
   *  workspace label catalogue. */
  language: string;
  /** Localized copy — the navigator's visible strings (caller passes the
   *  currently chosen UI language's strings, same as the workspace copy
   *  catalogue pattern). */
  copy: {
    /** Button/trigger label, e.g. "Labs". */
    allLabs: string;
    /** Grouped sheet title, e.g. "All 79 labs". */
    labsTitle: string;
    /** Grouped sheet description. */
    labsDescription: string;
    /** ARIA label for the desktop dropdown trigger. */
    allLabsAriaLabel: string;
  };
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
  return GROUPS_ORDER.map((g) => ({
    group: g,
    entries: TAB_REGISTRY.filter((t) => t.group === g),
  }));
}

export function TabNavigator({ activeTab, onTabChange, language, copy, className }: TabNavigatorProps) {
  const isDesktop = useViewportWidth();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const groups = tabGroupsFromRegistry();

  const localizedLabel = (value: string, fallback: string) =>
    getWorkspaceTabLabel(language, value, fallback);

  const handlePick = (value: string) => {
    onTabChange(value);
    // A lab selection is a completed mobile navigation action: close the
    // controlled sheet so its modal overlay cannot block the selected panel.
    setIsSheetOpen(false);
    // Return focus/scroll position predictably: the caller's tab switch
    // scrolls the new panel into view via the existing TabPanel autofocus.
  };

  if (!isDesktop) {
    return (
      <div className={className}>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 bg-card border-border text-sm h-11"
              aria-label={copy.allLabsAriaLabel}
              data-testid="tab-navigator-trigger"
            >
              <ListTree className="h-4 w-4" />
              {copy.allLabs}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
            <SheetHeader>
              <SheetTitle>{copy.labsTitle}</SheetTitle>
              <SheetDescription>{copy.labsDescription}</SheetDescription>
            </SheetHeader>
            <div className="mt-2 space-y-4 pb-6">
              {groups.map(
                ({ group, entries }) =>
                  entries.length > 0 && (
                    <div key={group}>
                      <h3 className="px-1 pt-2 first:pt-0 text-[11px] font-bold uppercase tracking-wide text-primary border-b border-border/60 mb-2 pb-1">
                        {TAB_GROUP_LABELS[group]} ({entries.length})
                      </h3>
                      <ul className="mt-1.5">
                        {entries.map((tab) => {
                          const isActive = tab.value === activeTab;
                          return (
                            <li key={tab.value}>
                              <button
                                type="button"
                                onClick={() => handlePick(tab.value)}
                                className={
                                  'block w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors ' +
                                  (isActive
                                    ? 'bg-primary text-primary-foreground font-medium'
                                    : 'text-foreground hover:bg-muted')
                                }
                                aria-current={isActive ? 'true' : undefined}
                              >
                                {localizedLabel(tab.value, tab.label)}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ),
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
          aria-label={copy.allLabsAriaLabel}
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

