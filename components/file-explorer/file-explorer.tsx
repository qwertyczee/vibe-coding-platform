'use client';

import {
    ChevronRightIcon,
    ChevronDownIcon,
    FolderIcon,
    FileIcon,
    SearchIcon,
} from 'lucide-react';
import { FileContent } from '@/components/file-explorer/file-content';
import { Panel, PanelHeader, type PanelTone } from '@/components/panels/panels';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { buildFileTree, type FileNode } from './build-file-tree';
import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';

interface Props {
    className?: string;
    disabled?: boolean;
    paths: string[];
    sandboxId?: string;
    tone?: PanelTone;
    glow?: boolean;
}

export const FileExplorer = memo(function FileExplorer({
    className,
    disabled,
    paths,
    sandboxId,
    tone = 'surface',
    glow,
}: Props) {
    const fileTree = useMemo(() => buildFileTree(paths), [paths]);
    const [selected, setSelected] = useState<FileNode | null>(null);
    const [fs, setFs] = useState<FileNode[]>(fileTree);
    const [search, setSearch] = useState('');
    const [isCompact, setIsCompact] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        setFs(fileTree);
    }, [fileTree]);

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 1023px)');
        const onChange = (event: MediaQueryListEvent) => setIsCompact(event.matches);
        setIsCompact(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    const toggleFolder = useCallback((path: string) => {
        setFs(prev => {
            const updateNode = (nodes: FileNode[]): FileNode[] =>
                nodes.map(node => {
                    if (node.path === path && node.type === 'folder') {
                        return { ...node, expanded: !node.expanded };
                    } else if (node.children) {
                        return { ...node, children: updateNode(node.children) };
                    } else {
                        return node;
                    }
                });
            return updateNode(prev);
        });
    }, []);

    const selectFile = useCallback((node: FileNode) => {
        if (node.type === 'file') {
            setSelected(node);
            if (isCompact) {
                setDrawerOpen(true);
            }
        }
    }, [isCompact]);

    const renderFileTree = useCallback(
        (nodes: FileNode[], depth = 0) => {
            return nodes.map(node => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    depth={depth}
                    selected={selected}
                    onToggleFolder={toggleFolder}
                    onSelectFile={selectFile}
                    renderFileTree={renderFileTree}
                />
            ));
        },
        [selected, toggleFolder, selectFile]
    );

    const flatFiles = useMemo(() => flattenFiles(fileTree), [fileTree]);

    const filteredFiles = useMemo(() => {
        if (!search.trim()) {
            return flatFiles;
        }
        const q = search.trim().toLowerCase();
        return flatFiles.filter(node => node.path.toLowerCase().includes(q));
    }, [flatFiles, search]);

    return (
        <Panel className={className} tone={tone} glow={glow}>
            <PanelHeader tone="muted" className="gap-4">
                <div className="flex items-center gap-3 text-white/80">
                    <FolderIcon className="h-4 w-4" />
                    <span className="text-xs tracking-[0.3em]">Sandbox Remote Files</span>
                </div>
                {selected && !disabled ? (
                    <span className="ml-auto hidden max-w-[50%] truncate text-[11px] uppercase tracking-[0.24em] text-white/40 lg:block">
                        {selected.path}
                    </span>
                ) : null}
            </PanelHeader>

            <div className="flex h-full flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
                {isCompact ? (
                    <CompactExplorer
                        search={search}
                        onSearchChange={setSearch}
                        files={filteredFiles}
                        onSelectFile={selectFile}
                    />
                ) : (
                    <DesktopExplorer
                        tree={renderFileTree(fs)}
                        selected={selected}
                        sandboxId={sandboxId}
                        disabled={disabled}
                    />
                )}
            </div>

            {isCompact ? (
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetContent
                        side="bottom"
                        className="h-[75vh] rounded-t-[32px] border border-white/10 bg-surface-200/95 p-0 text-foreground shadow-[0_-40px_120px_-60px_rgba(8,15,32,0.85)] backdrop-blur-2xl"
                    >
                        <SheetHeader className="gap-2 border-b border-white/10 px-6 pb-4 pt-6 text-left">
                            <SheetTitle className="text-lg text-white">
                                {selected?.name ?? 'Preview file'}
                            </SheetTitle>
                            <SheetDescription className="text-xs uppercase tracking-[0.32em] text-white/50">
                                {selected?.path ?? 'Select a file to inspect its content'}
                            </SheetDescription>
                        </SheetHeader>
                        <div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
                            <div className="h-full overflow-hidden rounded-[24px] border border-white/10 bg-surface-100/70">
                                {selected && sandboxId && !disabled ? (
                                    <FileContent
                                        sandboxId={sandboxId}
                                        path={selected.path.substring(1)}
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                                        Select a file to preview
                                    </div>
                                )}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            ) : null}
        </Panel>
    );
});

interface FileTreeNodeProps {
    node: FileNode;
    depth: number;
    selected: FileNode | null;
    onToggleFolder: (path: string) => void;
    onSelectFile: (node: FileNode) => void;
    renderFileTree: (nodes: FileNode[], depth: number) => React.ReactNode;
}

const FileTreeNode = memo(function FileTreeNode({
    node,
    depth,
    selected,
    onToggleFolder,
    onSelectFile,
    renderFileTree,
}: FileTreeNodeProps) {
    const isSelected = selected?.path === node.path;

    const handleClick = useCallback(() => {
        if (node.type === 'folder') {
            onToggleFolder(node.path);
        } else {
            onSelectFile(node);
        }
    }, [node, onToggleFolder, onSelectFile]);

    const paddingLeft = `${depth * 16 + 12}px`;

    return (
        <div>
            <button
                className={cn(
                    'group flex w-full items-center rounded-xl border border-transparent px-3 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/5',
                    isSelected &&
                        'border-white/25 bg-white/10 text-white shadow-[0_20px_60px_-40px_rgba(75,139,255,0.6)]'
                )}
                style={{ paddingLeft }}
                type="button"
                onClick={handleClick}
            >
                {node.type === 'folder' ? (
                    <>
                        {node.expanded ? (
                            <ChevronDownIcon className="mr-2 h-4 w-4" />
                        ) : (
                            <ChevronRightIcon className="mr-2 h-4 w-4" />
                        )}
                        <FolderIcon className="mr-2 h-4 w-4 text-accent-secondary" />
                    </>
                ) : (
                    <>
                        <div className="mr-2 h-4 w-4" />
                        <FileIcon className="mr-2 h-4 w-4 text-white/60" />
                    </>
                )}
                <span className="truncate text-left text-xs uppercase tracking-[0.28em]">
                    {node.name}
                </span>
            </button>

            {node.type === 'folder' && node.expanded && node.children && (
                <div className="ml-4 border-l border-white/10 pl-3">
                    {renderFileTree(node.children, depth + 1)}
                </div>
            )}
        </div>
    );
});

interface CompactExplorerProps {
    search: string;
    onSearchChange: (value: string) => void;
    files: FileNode[];
    onSelectFile: (file: FileNode) => void;
}

function CompactExplorer({
    search,
    onSearchChange,
    files,
    onSelectFile,
}: CompactExplorerProps) {
    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <SearchIcon className="h-4 w-4 text-white/60" />
                <Input
                    value={search}
                    onChange={event => onSearchChange(event.target.value)}
                    placeholder="Search files"
                    className="h-8 flex-1 border-0 bg-transparent text-sm text-white/80 placeholder:text-white/40 focus-visible:ring-0"
                />
            </div>
            <ScrollArea className="flex-1">
                <div className="space-y-2 pb-16">
                    {files.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
                            No files match “{search}”
                        </div>
                    ) : (
                        files.map(node => (
                            <button
                                key={node.path}
                                type="button"
                                onClick={() => onSelectFile(node)}
                                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-white/30 hover:bg-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <FileIcon className="h-4 w-4 text-accent-secondary" />
                                    <span className="truncate text-xs uppercase tracking-[0.32em]">
                                        {node.name}
                                    </span>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-white/40" />
                            </button>
                        ))
                    )}
                </div>
                <ScrollBar orientation="vertical" className="hidden" />
            </ScrollArea>
        </div>
    );
}

interface DesktopExplorerProps {
    tree: React.ReactNode;
    selected: FileNode | null;
    sandboxId?: string;
    disabled?: boolean;
}

function DesktopExplorer({
    tree,
    selected,
    sandboxId,
    disabled,
}: DesktopExplorerProps) {
    return (
        <div className="flex h-full min-h-0 gap-4">
            <ScrollArea className="w-[45%] flex-shrink-0 rounded-[22px] border border-white/10 bg-surface-200/60 p-3">
                <div className="space-y-1">{tree}</div>
                <ScrollBar orientation="vertical" className="hidden" />
            </ScrollArea>
            <div className="flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-surface-100/70">
                {selected && sandboxId && !disabled ? (
                    <ScrollArea className="h-full">
                        <FileContent
                            sandboxId={sandboxId}
                            path={selected.path.substring(1)}
                        />
                    </ScrollArea>
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-white/60">
                        Select a file to preview
                    </div>
                )}
            </div>
        </div>
    );
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
    const files: FileNode[] = [];
    const traverse = (items: FileNode[]) => {
        items.forEach(item => {
            if (item.type === 'file') {
                files.push(item);
            }
            if (item.children) {
                traverse(item.children);
            }
        });
    };
    traverse(nodes);
    return files;
}
