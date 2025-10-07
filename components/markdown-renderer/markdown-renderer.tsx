import type { Components } from 'react-markdown';
import { memo, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Memoized component definitions to prevent recreation
const LinkComponent = memo(({ children, href, ...props }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
    </a>
));

const CodeComponent = memo(({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return (
        <code
            className={`${className || ''} bg-muted rounded px-1 py-0.5 font-mono text-sm`}
            {...props}
        >
            {children}
        </code>
    );
});

const PreComponent = memo(({ children, ...props }: any) => (
    <pre className="bg-muted overflow-x-auto rounded-sm p-3 text-sm" {...props}>
        {children}
    </pre>
));

const H1Component = memo(({ children, ...props }: any) => (
    <h1 className="mt-4 mb-2 text-lg font-semibold first:mt-0" {...props}>
        {children}
    </h1>
));

const H2Component = memo(({ children, ...props }: any) => (
    <h2 className="mt-3 mb-2 text-base font-semibold first:mt-0" {...props}>
        {children}
    </h2>
));

const H3Component = memo(({ children, ...props }: any) => (
    <h3 className="mt-2 mb-1 text-sm font-semibold first:mt-0" {...props}>
        {children}
    </h3>
));

const UlComponent = memo(({ children, ...props }: any) => (
    <ul className="mb-2 list-disc space-y-1 pl-4" {...props}>
        {children}
    </ul>
));

const OlComponent = memo(({ children, ...props }: any) => (
    <ol className="mb-2 list-decimal space-y-1 pl-4" {...props}>
        {children}
    </ol>
));

const PComponent = memo(({ children, ...props }: any) => (
    <p className="mb-2 last:mb-0" {...props}>
        {children}
    </p>
));

const BlockquoteComponent = memo(({ children, ...props }: any) => (
    <blockquote className="border-muted my-2 border-l-4 pl-4 italic" {...props}>
        {children}
    </blockquote>
));

// Static components object - created once and reused
const STATIC_COMPONENTS: Components = {
    a: LinkComponent,
    code: CodeComponent,
    pre: PreComponent,
    h1: H1Component,
    h2: H2Component,
    h3: H3Component,
    ul: UlComponent,
    ol: OlComponent,
    p: PComponent,
    blockquote: BlockquoteComponent,
};

export const MarkdownRenderer = memo(function MarkdownRenderer({
    content,
}: {
    content: string;
}) {
    // Memoize the content to prevent unnecessary re-renders
    const memoizedContent = useMemo(() => content, [content]);

    // Use static components to avoid recreation
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={STATIC_COMPONENTS}
        >
            {memoizedContent}
        </ReactMarkdown>
    );
});
